import { PaginatedOrderResult } from "../domain/OrderModel";

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(pages: number): Promise<PaginatedOrderResult[]>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string = 'http://127.0.0.1:8000';

        getResumeFuel(pages: number): Promise<PaginatedOrderResult[]> {
            try {
                const response = fetch(`${this.baseUrl}/orders-with-costFuel?page=${pages}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                return response.then((response) => response.json());
            }

            catch (error) {
                console.error('Error fetching data:', error);
                throw error;
            }
        }
        
}