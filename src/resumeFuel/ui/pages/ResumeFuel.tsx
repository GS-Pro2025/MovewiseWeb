import React, { useEffect, useState } from 'react';
import ResumeFuelTable from '../components/ResumeFuelTable';
import { ResumeFuelService } from '../../data/ResumeFuelServices';
import { PaginatedOrderResult } from '../../domain/OrderModel';

const ResumeFuel: React.FC = () => {
  const [resumeFuel, setResumeFuel] = useState<PaginatedOrderResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const resumeFuelServices = new ResumeFuelService();

  useEffect(() => {
    
    const fetchResumeFuel = async () => {
      try {
        setIsLoading(true);
        const response = await resumeFuelServices.getResumeFuel(1);
        setResumeFuel(response);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching resume fuel',error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumeFuel();
  }, []);
  
  // const [total, setTotal] = React.useState(0)
  // const [totalFuel, setTotalFuel] = React.useState(0)
  
  return (
    <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Resumen de Combustible</h1>
        <ResumeFuelTable data={resumeFuel} isLoading={isLoading} />
    </div>
  )
}

export default ResumeFuel
