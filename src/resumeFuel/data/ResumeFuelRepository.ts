import { WeeklyFuelDataResponse } from "../domain/CostFuelWithOrders";
import { fetchWithAuth } from '../../service/authService';

export interface ResumeFuelParams {
    year?: number;
    week?: number;
    truck_id?: number;
    page_size?: number;
}

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(params: ResumeFuelParams): Promise<WeeklyFuelDataResponse>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getResumeFuel(params: ResumeFuelParams): Promise<WeeklyFuelDataResponse> {
        // Build query params
        const queryParams = new URLSearchParams();
        
        if (params.year !== undefined) queryParams.append('year', params.year.toString());
        if (params.week !== undefined) queryParams.append('week', params.week.toString());
        if (params.truck_id !== undefined) queryParams.append('truck_id', params.truck_id.toString());
        if (params.page_size !== undefined) queryParams.append('page_size', params.page_size.toString());

        try {
            const response = await fetchWithAuth(
                `${this.baseUrl}/costfuels/list-with-orders/?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const body = await response.json();
            
            if (!body || !body.data) {
                throw new Error('Unexpected response shape from costfuels/list-with-orders');
            }
            
            return body as WeeklyFuelDataResponse;
        } catch (error) {
            console.error('Error in getResumeFuel:', error);
            throw error;
        }
    }
}