import { OrdersWithCostFuelResponse } from "../domain/ModelsResumeOrderWithCostFuel";
import Cookies from 'js-cookie';

const BASE_URL_API = "http://127.0.0.1:8000";

export async function fetchOrdersWithCostFuel(page: number = 1): Promise<OrdersWithCostFuelResponse> {
    const token = Cookies.get('authToken'); // Obtenemos el token de las cookies

    if (!token) {
        window.location.href = '/login'; // Redirigimos al login si no hay token
        throw new Error('No hay token de autenticación');
    }

    const url = `${BASE_URL_API}/orders-with-costFuel/?page=${page}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Incluimos el token en los headers
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            // Si el token ha expirado o no es válido, redirigimos al login
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data: OrdersWithCostFuelResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching orders with cost fuel:", error.message);
            throw error;
        }
        throw new Error('Error en la solicitud');
    }
}