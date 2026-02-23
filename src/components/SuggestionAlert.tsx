import React from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

interface SuggestionAlertProps {
  type: 'job' | 'company';
  onClose?: () => void;
}

const SuggestionAlert: React.FC<SuggestionAlertProps> = ({ type, onClose }) => {
  const navigate = useNavigate();

  const getContent = () => {
    switch (type) {
      case 'job':
        return {
          title: 'No hay trabajos disponibles',
          message: 'Necesitas crear al menos un trabajo antes de crear una orden.',
          buttonText: 'Crear Trabajo',
          path: '/app/jobs-tools',
          icon: <AddIcon />
        };
      case 'company':
        return {
          title: 'No hay empresas registradas',
          message: 'Necesitas registrar al menos una empresa antes de crear una orden.',
          buttonText: 'Registrar Empresa',
          path: '/app/customers',
          icon: <AddIcon />
        };
    }
  };

  const content = getContent();

  return (
    <Alert 
      severity="warning"
      action={
        <Button 
          color="inherit" 
          size="small"
          startIcon={content.icon}
          onClick={() => navigate(content.path)}
          sx={{
            borderColor: 'warning.main',
            '&:hover': {
              borderColor: 'warning.dark',
              backgroundColor: 'rgba(237, 108, 2, 0.04)'
            }
          }}
          variant="outlined"
        >
          {content.buttonText}
        </Button>
      }
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      <AlertTitle>{content.title}</AlertTitle>
      {content.message}
    </Alert>
  );
};

export default SuggestionAlert;