/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { createOrder, fetchCustomerFactories, fetchJobs, fetchOrderStates } from '../repository/repositoryCreateOrder';
import { CreateOrderModel, CustomerFactoryModel, OrderState, Person } from '../models/CreateOrderModel';
import { JobModel } from '../models/JobModel';
import { enqueueSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const initialPerson: Person = {
  first_name: '',
  last_name: '',
  address: '',
  email: '',
  phone: '',
};

const initialOrder: CreateOrderModel = {
  date: '',
  key_ref: '',
  address: '',
  state_usa: '',
  status: 'Pending',
  paystatus: 0,
  person: initialPerson,
  weight: 0,
  job: 0,
  customer_factory: 0,
};


const CreateOrder: React.FC = () => {
  const [order, setOrder] = useState<CreateOrderModel>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [states, setStates] = useState<OrderState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [cf, setCf] = useState<CustomerFactoryModel[]>([]);
  const [loadingCf, setLoadingCf] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setLoadingStates(true);
    fetchOrderStates()
      .then(setStates)
      .finally(() => setLoadingStates(false));
    setLoadingJobs(true);
    fetchJobs()
      .then(setJobs)
      .finally(() => setLoadingJobs(false));
    setLoadingCf(true);
    fetchCustomerFactories()
      .then(setCf)
      .finally(() => setLoadingCf(false));
  }, []);

  const handleChange = (field: keyof CreateOrderModel, value: any) => {
    setOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePersonChange = (field: keyof Person, value: any) => {
    setOrder((prev) => ({
      ...prev,
      person: {
        ...prev.person,
        [field]: value,
      },
    }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        //The same address for the person and the order
        order.person.address = order.address;
        
        const result = await createOrder(order);
        setLoading(false);

        // El repository retorna un objeto OrderCreated (con key) si es éxito, o { success: false, errorMessage }
        if ('key' in result && result.key) {
            enqueueSnackbar('Orden creada correctamente', { variant: 'success' });
            setSuccessMsg('Orden creada correctamente');
            setOrder(initialOrder);
            // Redirigir a addOperatorToOrder con el key de la orden creada
            navigate(`/add-operators-to-order/${result.key}`);
        } else {
            enqueueSnackbar('Error al crear la orden', { variant: 'error' });
            setErrorMsg(
            'errorMessage' in result && result.errorMessage
                ? result.errorMessage
                : 'Error al crear la orden'
            );
        }
    };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper sx={{ p: 4, width: 600 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Crear nueva orden
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Referencia"
              fullWidth
              value={order.key_ref}
              onChange={(e) => handleChange('key_ref', e.target.value)}
              required
            />
            <TextField
              label="Fecha"
              type="date"
              fullWidth
              value={order.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Dirección"
              fullWidth
              value={order.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
            <Autocomplete
                options={states}
                getOptionLabel={(option) => option.name || ''}
                loading={loadingStates}
                value={states.find((s) => s.code === order.state_usa) || null}
                onChange={(_, value) => handleChange('state_usa', value ? value.code : '')}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Estado (USA)"
                    fullWidth
                    required
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                        <>
                            {loadingStates ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                        </>
                        ),
                    }}
                    />
                )}
            />
            <TextField
              label="Peso (lb)"
              type="number"
              fullWidth
              value={order.weight}
              onChange={(e) => handleChange('weight', Number(e.target.value))}
              required
              inputProps={{ step: "any" }} 
            />
            <Autocomplete
              options={jobs}
              getOptionLabel={(option) => option.name || ''}
              loading={loadingJobs}
              value={jobs.find((j) => j.id === order.job) || null}
              onChange={(_, value) => handleChange('job', value ? value.id : 0)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Trabajo"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingJobs ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Autocomplete
              options={cf}
              getOptionLabel={(option) => option.name || ''}
              loading={loadingCf}
              value={cf.find((c) => c.id_factory === order.customer_factory) || null}
              onChange={(_, value) => handleChange('customer_factory', value ? value.id_factory : 0)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCf ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Datos del cliente
            </Typography>
            <TextField
              label="Nombre"
              fullWidth
              value={order.person.first_name}
              onChange={(e) => handlePersonChange('first_name', e.target.value)}
              required
            />
            <TextField
              label="Apellido"
              fullWidth
              value={order.person.last_name}
              onChange={(e) => handlePersonChange('last_name', e.target.value)}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={order.person.email}
              onChange={(e) => handlePersonChange('email', e.target.value)}
              required
            />
            <TextField
              label="Teléfono"
              fullWidth
              value={order.person.phone}
              onChange={(e) => handlePersonChange('phone', e.target.value)}
              required
            />
            {successMsg && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                {successMsg}
              </Typography>
            )}
            {errorMsg && (
              <Typography color="error.main" sx={{ mt: 2 }}>
                {errorMsg}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Crear orden
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateOrder;