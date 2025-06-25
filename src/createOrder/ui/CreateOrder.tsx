/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import 'react-phone-input-2/lib/material.css';
import PhoneInput from 'react-phone-input-2';
import { fetchCountries, fetchStates, fetchCities} from '../repository/repositoryLocation';
import { Country, State } from '../models/LocationModels';
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
  const location = useLocation();
  // Si viene una orden para continuar, úsala como initialOrder
  const continuedOrder = location.state?.orderToContinue;

  const [order, setOrder] = useState<CreateOrderModel>(
    continuedOrder
      ? {
          ...initialOrder,
          ...continuedOrder,
          date: continuedOrder.date, // ya viene adelantada
          key_ref: '', // limpia referencia si lo deseas
          status: 'Pending',
          paystatus: 0,
        }
      : initialOrder
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [states, setStates] = useState<OrderState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [cf, setCf] = useState<CustomerFactoryModel[]>([]);
  const [loadingCf, setLoadingCf] = useState(false);

  const [dispatchTicketFile, setDispatchTicketFile] = useState<File | null>(null);
  const [dispatchTicketPreview, setDispatchTicketPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [country, setCountry] = useState<Country | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [statesList, setStatesList] = useState<State[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStatesList, setLoadingStatesList] = useState(false);
  const [loadingCitiesList, setLoadingCitiesList] = useState(false);

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

  // Cargar países al montar
  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then(setCountries)
      .finally(() => setLoadingCountries(false));
    console.log('Countries loaded:', countries);
    console.log('States loaded:', states);
    console.log('Loading states:', loadingStates);
  }, [countries, loadingStates, states]);

  // Cargar estados cuando cambia el país
  useEffect(() => {
    if (country) {
      setLoadingStatesList(true);
      fetchStates(country.name)
        .then(setStatesList)
        .finally(() => setLoadingStatesList(false));
      setState(null);
      setCity(null);
      setCitiesList([]);
    }
  }, [country]);

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (country && state) {
      setLoadingCitiesList(true);
      fetchCities(country.name, state.name)
        .then(setCitiesList)
        .finally(() => setLoadingCitiesList(false));
      setCity(null);
    }
  }, [country, state]);

  // Actualizar state_usa cuando cambia la selección
  useEffect(() => {
    if (country && state && city) {
      handleChange('state_usa', `${country.name}, ${state.name}, ${city}`);
    }
  }, [country, state, city]);

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
  const handleDispatchTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDispatchTicketFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDispatchTicketPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDispatchTicketPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    order.person.address = order.address;

    // Validación de tamaño
    if (dispatchTicketFile && dispatchTicketFile.size > 5 * 1024 * 1024) {
      setLoading(false);
      enqueueSnackbar('Sorry, the image cannot be larger than 5mb.', { variant: 'error' });
      return;
    }

    let dispatchTicketString = '';
    if (dispatchTicketFile) {
      dispatchTicketString = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(dispatchTicketFile);
      });
    }

    const orderToSend = { ...order, dispatch_ticket: dispatchTicketString };

    const result = await createOrder(orderToSend);
    setLoading(false);

    if ('key' in result && result.key) {
      enqueueSnackbar('Order created successfully', { variant: 'success' });
      setSuccessMsg('Order created successfully');
      setOrder(initialOrder);
      setDispatchTicketFile(null);
      setDispatchTicketPreview(null);
      navigate(`/add-operators-to-order/${result.key}`);
    } else {
      enqueueSnackbar('Sorry there was an error creating the order', { variant: 'error' });
      setErrorMsg(
        'errorMessage' in result && result.errorMessage
          ? result.errorMessage
          : 'Error creating order, please try again later.',
      );
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper sx={{ p: 4, width: 600 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Create Order
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Reference"
              fullWidth
              value={order.key_ref}
              onChange={(e) => handleChange('key_ref', e.target.value)}
              required
            />
            <TextField
              label="Date"
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
              label="Adress"
              fullWidth
              value={order.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
            <Autocomplete
                options={countries}
                getOptionLabel={option => option.name}
                loading={loadingCountries}
                value={country}
                onChange={(_, value) => setCountry(value)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Country"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCountries ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
            />
            {country && (
              <Autocomplete
                options={statesList}
                getOptionLabel={option => option.name}
                loading={loadingStatesList}
                value={state}
                onChange={(_, value) => setState(value)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="State/Province"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStatesList ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
            {country && state && (
              <Autocomplete
                options={citiesList}
                getOptionLabel={option => option}
                loading={loadingCitiesList}
                value={city}
                onChange={(_, value) => setCity(value)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="City"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCitiesList ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
            <TextField
              label="Weigth (lb)"
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
                  label="Job"
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
                  label="Company"
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
              Customer data
            </Typography>
            <TextField
              label="Firts Name"
              fullWidth
              value={order.person.first_name}
              onChange={(e) => handlePersonChange('first_name', e.target.value)}
              required
            />
            <TextField
              label="Last Name"
              fullWidth
              value={order.person.last_name}
              onChange={(e) => handlePersonChange('last_name', e.target.value)}
              required
            />
            <TextField
              label="Email"
              type="Email"
              fullWidth
              value={order.person.email}
              onChange={(e) => handlePersonChange('email', e.target.value)}
              required
            />
            <PhoneInput
              country={'us'}
              value={order.person.phone}
              onChange={phone => handlePersonChange('phone', phone)}
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: false,
              }}
              inputStyle={{ width: '100%' }}
              specialLabel="Phone"
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
            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 1 }}
              onClick={() => fileInputRef.current?.click()}
            >
              {dispatchTicketFile ? 'Change ticket image' : 'Upload ticket image (optional)'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleDispatchTicketChange}
              />
            </Button>
            {dispatchTicketPreview && (
              <img
                src={dispatchTicketPreview}
                alt="Dispatch Ticket"
                style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }}
              />
            )}
            {/** Quitar la imagen */}
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setDispatchTicketFile(null);
                setDispatchTicketPreview(null);
              }}
              sx={{ mt: 1 }}>
              Remove dispatch ticket
              <span style={{ marginLeft: 8 }}></span>
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Create order
              </Button>
            </Box>
            
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateOrder;