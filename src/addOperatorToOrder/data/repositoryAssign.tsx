import Cookies from 'js-cookie';
const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
import { AssignmentResponse, CreateAssignmentData } from '../domain/AssignModels';
/** body to send
 * {
    "operator": 1,
    "truck": 1,
    "order": "08d540c6-d4d2-4e01-b74f-7d6aeeb2a5dd",
    "assigned_at": "2025-05-19T12:00:00Z",
    "rol": "driver",
    "additional_costs": ""
}
 */
export async function assignOperatorToOrder(
    data: CreateAssignmentData,
): Promise<void> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
    try {
        const response = await fetch(`${BASE_URL_API}/assigns/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });
    
        if (!response.ok) {
        throw new Error('Error al asignar el operador a la orden');
        }
    } catch (error) {
        console.error('Error assigning operator:', error);
        throw error;
    }
}

export async function unassignOperatorFromOrder(
    assignmentId: number,
): Promise<void> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
    try {
        const response = await fetch(`${BASE_URL_API}/assigns/${assignmentId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        });
    
        if (!response.ok) {
        throw new Error('Error al desasignar el operador de la orden');
        }
    } catch (error) {
        console.error('Error unassigning operator:', error);
        throw error;
    }
}

export async function fetchAssignmentsByOrderKey(orderKey: string): Promise<AssignmentResponse> {
    const token = Cookies.get('authToken');
    if (!token) {
        window.location.href = '/login';
        throw new Error('No hay token de autenticación');
    }
    
    try {
        const response = await fetch(`${BASE_URL_API}/assigns/order/${orderKey}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        });
    
        if (!response.ok) {
        throw new Error('Error al obtener las asignaciones de la orden');
        }
    
        return await response.json();
    } catch (error) {
        console.error('Error fetching assignments:', error);
        throw error;
    }
    }