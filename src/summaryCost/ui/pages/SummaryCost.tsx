import React, { useEffect, useState } from 'react';
import SummaryCostTable from '../components/SummaryCostTable';
import { SummaryCostService } from '../../data/SummaryCostService';
import { PaginatedOrderSummaryResult } from '../../domain/OrderSummaryModel';

const SummaryCost: React.FC = () => {
    const [summaryCost, setSummaryCost] = useState<PaginatedOrderSummaryResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const summaryCostService = new SummaryCostService();

    useEffect(() => {
        const fetchSummaryCost = async () => {
            try {
                setIsLoading(true);
                const response = await summaryCostService.getSummaryCost(1);
                setSummaryCost(response);
            } catch (error) {
                console.error('Error fetching summary cost', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummaryCost();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Resumen de Costos</h1>
            <SummaryCostTable data={summaryCost} isLoading={isLoading} />
        </div>
    );
};

export default SummaryCost;