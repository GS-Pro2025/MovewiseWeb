/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkhouseCreationOrderData } from "../domain/WarehouseModel";

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';



export const createWorkhouseOrder = async (orderData: WorkhouseCreationOrderData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        throw new Error('No hay token de autenticación');
    }
    
    try {
        const response = await fetch(`${BASE_URL_API}/workhouse/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        });
    
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.messDev || 'Error creating workhouse order');
        }
    
        return await response.json();
    } catch (err: any) {
        throw new Error(err.message || 'An unexpected error occurred');
    }
};


export const fetchWorkhouseOrders = async (page: number, pageSize: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        throw new Error('No hay token de autenticación');
    }

    try {
        const response = await fetch(`${BASE_URL_API}/workhouse/?page=${page}&page_size=${pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.messDev || 'Error fetching workhouse orders');
        }

        return await response.json();
    } catch (err: any) {
        throw new Error(err.message || 'An unexpected error occurred');
    }
}

