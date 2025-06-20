import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
  Collapse,
  CircularProgress, 
  Alert
} from '@mui/material';
import { AddCircleOutline, DeleteOutline, SearchOutlined } from '@mui/icons-material';
import { TransitionGroup } from 'react-transition-group';
import { CustomerFactoriesRepository } from '../data/CompanyRepository';
import { CustomerModel } from '../domain/companyModel';
import { useSnackbar } from 'notistack'; // <-- Importa useSnackbar

const customerFactoriesRepository = new CustomerFactoriesRepository();

const CustomersView: React.FC = () => {
  const [companies, setCompanies] = useState<CustomerModel[]>([]);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null); 

  const { enqueueSnackbar } = useSnackbar(); // <-- Hook para notificaciones

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null); 
    try {
      const data = await customerFactoriesRepository.getAll();
      setCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []); 

  const handleAddCompany = async () => {
    if (newCompanyName.trim() === '') {
      enqueueSnackbar('Company name cannot be empty.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const addedCompany = await customerFactoriesRepository.create(newCompanyName.trim());
      setCompanies((prev) => [...prev, addedCompany]); 
      setNewCompanyName('');
      enqueueSnackbar('Company added successfully.', { variant: 'success' });
    } catch (err) {
      console.error('Error adding company:', err);
      setError(err instanceof Error ? err.message : 'Unknown error adding company.');
      enqueueSnackbar('Error adding company.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this company?')) { 
        setLoading(true);
        setError(null);
        try {
            await customerFactoriesRepository.delete(id);
            setCompanies((prev) => prev.filter((company) => company.id_factory !== id)); 
            enqueueSnackbar('Company deleted successfully.', { variant: 'success' });
        } catch (err) {
            console.error('Error deleting company:', err);
            setError(err instanceof Error ? err.message : 'Unknown error deleting company.');
            enqueueSnackbar('Error deleting company.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 4,
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
        Our Allied Companies
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Here you can manage the list of companies we work with.
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#fff',
        }}
      >
        {/* Global error messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Section to add new company */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Name of the new company"
            variant="outlined"
            fullWidth
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            onKeyDown={(e) => { 
                if (e.key === 'Enter' && !loading) {
                handleAddCompany();
                }
            }}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused fieldset': {
                  borderColor: '#007bff',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddCompany}
            startIcon={<AddCircleOutline />}
            disabled={loading} 
            sx={{
              backgroundColor: '#007bff',
              '&:hover': {
                backgroundColor: '#0056b3',
              },
              borderRadius: 2,
              py: 1.5,
              px: 3,
              fontWeight: 'bold',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Add'}
          </Button>
        </Box>

        {/* Search section */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Search company"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading} 
            slotProps={{
            input: {
            startAdornment: (
                <InputAdornment position="start">
                <SearchOutlined color="action" />
                </InputAdornment>
            ),
            },
            root: { 
            sx: {
                borderRadius: 2,
                '&.Mui-focused fieldset': {
                borderColor: '#007bff',
                },
            },
            },
        }}
        />
        </Box>

        {/* Company list */}
        <Typography variant="h6" sx={{ mb: 2, color: '#444' }}>
          Company List
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Loading companies...</Typography>
          </Box>
        )}

        {!loading && filteredCompanies.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              border: '1px dashed #ccc',
              borderRadius: 2,
              color: 'text.secondary',
              backgroundColor: '#f0f0f0',
            }}
          >
            <Typography variant="body1">No companies match your search.</Typography>
          </Box>
        )}

        {!loading && filteredCompanies.length > 0 && (
          <List
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#fdfdfd',
              border: '1px solid #eee',
            }}
          >
            <TransitionGroup>
              {filteredCompanies.map((company) => (
                <Collapse key={company.id_factory}> {/* Use id_factory as key */}
                  <ListItem
                    divider
                    sx={{
                      py: 1.5,
                      px: 3,
                      '&:hover': {
                        backgroundColor: '#e6f7ff', 
                      },
                    }}
                  >
                    <ListItemText
                    primary={company.name}
                    slotProps={{
                        primary: {
                        variant: 'body1',
                        fontWeight: 'medium',
                        color: '#333',
                        },
                    }}
                    />
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteCompany(company.id_factory)} 
                      disabled={loading} 
                      sx={{
                        color: '#dc3545', 
                        '&:hover': {
                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        },
                      }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </ListItem>
                </Collapse>
              ))}
            </TransitionGroup>
          </List>
        )}
      </Paper>

    </Box>
  );
};

export default CustomersView;
