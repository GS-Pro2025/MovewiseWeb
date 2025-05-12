import React, { useEffect, useState } from 'react';
import ExtraCostTable from '../components/ExtraCostTable';
import { ExtraCostService } from '../../data/ExtraCostService';
import { ExtraCostResponse } from '../../domain/ExtraCostModel';

const ExtraCostPage: React.FC = () => {
  const [extraCosts, setExtraCosts] = useState<ExtraCostResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const extraCostService = new ExtraCostService();

  useEffect(() => {
    const fetchExtraCosts = async () => {
      try {
        setIsLoading(true);
        const response = await extraCostService.getExtraCosts();
        setExtraCosts(response);
      } catch (error) {
        console.error('Error fetching extra costs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtraCosts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Extra Costs</h1>
      <ExtraCostTable data={extraCosts} isLoading={isLoading} />
    </div>
  );
};

export default ExtraCostPage;