import React from 'react';
import { Box, Container } from '@mui/material';
import StatementsTable from './StatementsList';

const StatementPage: React.FC = () => {
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh',
        borderRadius: 2,
        p: 2 
      }}>
        <StatementsTable />
      </Box>
    </Container>
  );
};

export default StatementPage;