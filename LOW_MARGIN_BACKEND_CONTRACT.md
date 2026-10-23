# Contrato backend — Órdenes de margen bajo

Endpoint nuevo que reemplaza el cálculo que hoy hace el frontend en la pestaña
**Financials → Márgenes bajos**. Hoy el frontend pide `summary-list-financial`, luego hace **una
petición `assigns/order/{key}/operators/` por cada orden** y reparte los salarios en el navegador.
Con un semestre o un año son cientos de peticiones. Este endpoint hace todo en una sola consulta.

El frontend ya está preparado: llama a este endpoint primero y, si responde 404/405/501, usa el
cálculo anterior como respaldo. En cuanto se publique, empieza a usarlo sin cambios en el front.

---

## 1. Request

`GET /financials/low-margin/`

Auth: `Authorization: Bearer <jwt>`. Mismos permisos que `summary-list-financial` (Financials es
solo para super administrador). Todo filtrado por la empresa del token.

Período: **o bien** `from` + `to`, **o bien** `number_week` + `year` (la misma numeración de semana
que ya usa `summary-list-financial`). Si llegan ambos, gana `from`/`to`.

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | — | Inicio inclusivo, por **fecha de la orden** (`Order.date`). |
| `to` | `YYYY-MM-DD` | — | Fin inclusivo. Debe ser ≥ `from`, si no → 400. |
| `number_week` | int | — | Alternativa a from/to. |
| `year` | int | — | Requerido con `number_week`. |
| `threshold` | número 0–100 | `25` | Se devuelven filas con `margin < threshold` (ver §3). |
| `group_by` | `reference` \| `order` | `reference` | `reference` agrupa por `key_ref`. |
| `search` | string | — | Coincidencia parcial, sin distinguir mayúsculas, en `key_ref` y nombre del cliente. |
| `income` | `all` \| `with` \| `without` | `all` | `with`: solo filas con `income > 0`; `without`: solo `income <= 0`. Se aplica **después de agrupar** (sobre el ingreso de la fila) y antes de calcular `kpis` y `total_rows`. |
| `sort` | `margin` \| `profit` \| `income` \| `cost` | `margin` | `margin` y `profit`: ascendente (peor primero, `margin` null primero). `income` y `cost`: descendente. |
| `page` | int | `1` | Paginación como el resto de la API. |
| `page_size` | int | `50` | Máx. 500. |

Errores: `400 {"detail": "mensaje en español"}` para parámetros inválidos (falta período, fechas
invertidas, `group_by` desconocido…).

## 2. Response (200)

```json
{
  "kpis": {
    "total_rows": 140,
    "at_risk_count": 12,
    "loss_count": 4,
    "loss_total": -3250.5,
    "income_at_risk": 41000.0,
    "avg_margin": 8.3
  },
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "REF-1042",
      "key_ref": "REF-1042",
      "client": "Acme Corp",
      "date": null,
      "order_count": 2,
      "income": 1800.0,
      "breakdown": { "salaries": 1100.0, "expense": 300.0, "fuel": 150.0, "work": 80.0, "bonus": 50.0 },
      "cost": 1680.0,
      "profit": 120.0,
      "margin": 6.67,
      "no_weight": false,
      "children": [
        {
          "id": "b1f0c2e4-....",
          "key_ref": "REF-1042",
          "client": "Acme Corp",
          "date": "2026-10-12",
          "order_count": 1,
          "income": 1000.0,
          "breakdown": { "salaries": 600.0, "expense": 150.0, "fuel": 80.0, "work": 40.0, "bonus": 25.0 },
          "cost": 895.0,
          "profit": 105.0,
          "margin": 10.5,
          "no_weight": false,
          "children": []
        }
      ]
    }
  ]
}
```

- **Números como `number`** (no strings), con 2 decimales de precisión.
- `kpis` se calcula sobre **todo** el resultado filtrado por `threshold` y `search`, **no solo la
  página**. `total_rows` = filas del período **antes** de filtrar por `threshold` (con el mismo
  `group_by` y `search`).
- `avg_margin` = `(Σ profit de las filas en riesgo) / (Σ income de las filas en riesgo) × 100`
  (margen ponderado, no promedio simple); `null` si `income_at_risk = 0`.
- `loss_count` / `loss_total`: filas con `profit < 0` y la suma de su `profit`.
- `count` = filas en riesgo (total, no de la página).
- `id`: con `group_by=reference` es el `key_ref`; con `group_by=order` es el `key` (UUID) de la orden.
  Los `children` siempre llevan el `key` de la orden como `id` (el frontend navega con él a
  `add-operators-to-order/{key}`).
- `date`: `null` en filas agrupadas; fecha de la orden en `children` y en `group_by=order`.
- Con `group_by=order`, `children` es `[]`.

## 3. Reglas de cálculo (deben coincidir con Financials)

Por **orden**:

```
costo   = expense + fuelCost + workCost + salarios_repartidos + bonus
resultado (profit) = income - costo
margen  = profit / income * 100          (null si income <= 0)
```

- `rentingCost` **no** entra en el costo (igual que la tabla de Financials hoy).
- `workCost` = costos extra (`breakdown.work`); `fuelCost` = gasolina (`breakdown.fuel`).
- `salarios_repartidos` = salarios de conductores + resto de roles, ya repartidos (§4).

Por **referencia** (`group_by=reference`): suma de las órdenes con el mismo `key_ref`; el margen
se calcula sobre las sumas.

**En riesgo**: `margin < threshold` (las pérdidas, `margin < 0`, entran siempre que
`threshold > 0`). Si `income <= 0` y `costo > 0` también está en riesgo (margen `null`). Si
`income <= 0` y `costo == 0`, no.

El filtro de `threshold` se aplica **después** de agrupar (una referencia puede estar en riesgo
aunque alguna de sus órdenes no, y al revés).

## 4. Reparto de salarios (el punto delicado)

Equivale a `computeProportionalSalaries` del frontend
(`src/financials/util/proportionalSalaryUtils.ts`), que es lo que Financials muestra hoy:

1. Tomar todas las asignaciones (`Assign`) de las órdenes del período.
2. Agrupar por **(operador, fecha de la asignación)**, sobre todas las órdenes (no por orden).
3. Para cada asignación:
   - `salary_type = 'day'`: el salario diario está guardado completo en cada asignación y se
     redistribuye por peso:
     `salario_en_la_orden = salario × peso_orden / Σ pesos de las órdenes de ese operador ese día`.
     Si la suma de pesos es 0 → partes iguales: `salario / nº de órdenes ese día`.
   - `salary_type = 'hour'` o `null`: se queda tal cual (`salario` de la asignación).
4. Sumar por orden, separando `rol = 'driver'` (salarios de conductor) del resto (otros salarios).
   El endpoint solo necesita la suma (`breakdown.salaries`), pero el desglose por rol es útil si se
   quiere exponer después.
5. `no_weight = true` si alguna orden de la fila tiene `weight` nulo o ≤ 0 (el reparto cayó en
   partes iguales y el resultado es menos fiable). En filas agrupadas: si alguna hija lo tiene.

**Importante:** el grupo (operador, día) debe armarse con **todas** las órdenes de ese día, aun si
alguna queda fuera del filtro `search`/`threshold`/paginación. Filtrar y paginar solo **después**
de calcular. Si el período corta un día a la mitad no hay problema: las órdenes se filtran por
fecha de orden y un día completo siempre cae en un mismo período.

## 5. Sugerencia de implementación

Una consulta con agregaciones (ORM o SQL con funciones ventana):

```sql
-- Sketch (PostgreSQL). Peso total por operador/día para repartir el salario diario.
WITH a AS (
  SELECT asg.order_id, asg.operator_id, asg.date::date AS d, asg.salary, asg.salary_type,
         COALESCE(o.weight, 0) AS w
  FROM assign asg JOIN orders o ON o.key = asg.order_id
  WHERE o.company_id = :company AND o.date BETWEEN :from AND :to
),
s AS (
  SELECT a.*,
         SUM(w)  OVER (PARTITION BY operator_id, d) AS sum_w,
         COUNT(*) OVER (PARTITION BY operator_id, d) AS n
  FROM a
)
SELECT order_id,
       SUM(CASE WHEN salary_type = 'day'
                THEN CASE WHEN sum_w > 0 THEN salary * w / sum_w ELSE salary / n END
                ELSE salary END) AS salaries
FROM s GROUP BY order_id;
```

Luego unir con los costos de la orden (`expense`, `fuelCost`, `workCost`, `bonus`, `income`) que ya
calcula `summary-list-financial`, agrupar por `key_ref` si corresponde, filtrar por margen,
ordenar y paginar. Los `kpis` salen del mismo conjunto filtrado antes de paginar.

## 6. Pruebas de aceptación

1. Para una semana conocida, `group_by=order&threshold=100` devuelve, orden por orden, **los mismos
   `income`, `cost` y `profit`** que la tabla de Financials (que usa el reparto en el front).
2. Operador `day` en 2 órdenes el mismo día con pesos 30/70 → 30 % y 70 % de su salario.
3. Mismos pesos 0/0 → 50 % y 50 %. Operador `hour` → salario completo en cada orden.
4. `threshold=25`: orden con margen 24.9 % aparece, 25.0 % no; una con `income = 0` y costo > 0
   aparece con `margin: null`.
5. `group_by=reference` con una referencia de 2 órdenes (una con pérdida, otra con ganancia):
   la fila agrupada usa las sumas y trae las 2 en `children`.
6. `kpis` son iguales en la página 1 y en la 2.
7. Período de un año con cientos de órdenes: respuesta en pocos segundos (una consulta, sin N+1).
