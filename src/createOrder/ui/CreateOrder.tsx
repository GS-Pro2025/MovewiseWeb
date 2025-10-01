/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Button,
  TextField,
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
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScaleIcon from '@mui/icons-material/Scale';
import HomeIcon from '@mui/icons-material/Home';

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
};

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
  const continuedOrder = location.state?.orderToContinue;

  const [order, setOrder] = useState<CreateOrderModel>(
    continuedOrder
      ? {
          ...initialOrder,
          ...continuedOrder,
          date: continuedOrder.date, 
          key_ref: continuedOrder.key_ref,
          status: 'Pending',
          paystatus: 0,
        }
      : initialOrder
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [states, setStates] = useState<OrderState[]>([]);
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

  const [initializingLocation, setInitializingLocation] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);

  const navigate = useNavigate();
  
  useEffect(() => {
    fetchOrderStates()
      .then(setStates)
      .catch(err => console.error('Error loading states:', err));
    setLoadingJobs(true);
    fetchJobs()
      .then(setJobs)
      .finally(() => setLoadingJobs(false));
    setLoadingCf(true);
    fetchCustomerFactories()
      .then(setCf)
      .finally(() => setLoadingCf(false));
  }, []);

  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then(setCountries)
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    if (country && !initializingLocation) {
      setLoadingStatesList(true);
      fetchStates(country.name)
        .then(setStatesList)
        .finally(() => setLoadingStatesList(false));
      setState(null);
      setCity(null);
      setCitiesList([]);
    }
  }, [country, initializingLocation]);

  useEffect(() => {
    if (country && state && !initializingLocation) {
      setLoadingCitiesList(true);
      fetchCities(country.name, state.name)
        .then(setCitiesList)
        .finally(() => setLoadingCitiesList(false));
      setCity(null);
    }
  }, [country, state, initializingLocation]);

  useEffect(() => {
    if (
      continuedOrder &&
      continuedOrder.state_usa &&
      initializingLocation &&
      countries.length > 0 &&
      statesList.length > 0 &&
      citiesList.length > 0 &&
      jobs.length > 0
    ) {
      const [countryName, stateName, cityName] = continuedOrder.state_usa.split(',').map((s: string) => s.trim());

      const foundCountry = countries.find(c => c.name === countryName);
      if (foundCountry) setCountry(foundCountry);

      const foundState = statesList.find(s => s.name === stateName);
      if (foundState) setState(foundState);

      const foundCity = citiesList.find(c => c === cityName);
      if (foundCity) setCity(foundCity);

      if (
        continuedOrder.job &&
        !jobs.some((j) => j.id === continuedOrder.job)
      ) {
        setJobs((prev) => [
          ...prev,
          { id: continuedOrder.job, name: String(continuedOrder.job) },
        ]);
      }

      setInitializingLocation(false);
    }
  }, [
    continuedOrder,
    countries,
    statesList,
    citiesList,
    jobs,
    initializingLocation,
  ]);

  useEffect(() => {
    if (continuedOrder) {
      if (
        continuedOrder.job &&
        !jobs.some((j) => j.id === continuedOrder.job)
      ) {
        setJobs((prev) => [
          ...prev,
          { id: continuedOrder.job, name: String(continuedOrder.job) },
        ]);
      }
      if (
        continuedOrder.state_usa &&
        !states.some((s) => s.name === continuedOrder.state_usa)
      ) {
        setStates((prev) => [
          ...prev,
          { id: prev.length + 1, name: String(continuedOrder.state_usa), code: '', },
        ]);
      }
    }
  }, [continuedOrder, jobs, states]);

  const handleChange = useCallback((field: keyof CreateOrderModel, value: any) => {
    setOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handlePersonChange = useCallback((field: keyof Person, value: any) => {
    setOrder((prev) => ({
      ...prev,
      person: {
        ...prev.person,
        [field]: value,
      },
    }));
  }, []);
  
  const handleDispatchTicketChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDispatchTicketFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDispatchTicketPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDispatchTicketPreview(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    order.person.address = order.address;

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
      navigate(`/app/add-operators-to-order/${result.key}`);
    } else {
      enqueueSnackbar('Sorry there was an error creating the order', { variant: 'error' });
      setErrorMsg(
        'errorMessage' in result && result.errorMessage
          ? result.errorMessage
          : 'Error creating order, please try again later.',
      );
    }
  };

  useEffect(() => {
    if (continuedOrder && jobs.length > 0) {
      const jobName = String(continuedOrder.job).trim().toLowerCase();
      const foundJob = jobs.find(j => j.name.trim().toLowerCase() === jobName);
      if (foundJob) {
        setOrder(prev => ({
          ...prev,
          job: foundJob.id
        }));
      }
    }
  }, [continuedOrder, jobs]);

  useEffect(() => {
    if (!continuedOrder && country && state && city) {
      setOrder(prev => ({
        ...prev,
        state_usa: `${country.name}, ${state.name}, ${city}`
      }));
    }
  }, [country, state, city, continuedOrder]);

  return (
    <div className="min-h-screen py-8 px-4 flex items-start justify-center">
      <div className="w-full max-w-6xl">
        <div 
          className="bg-white/50 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden"
          style={{ borderTop: `4px solid ${COLORS.primary}` }}
        >
          <div className="text-center mb-10">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: COLORS.primary }}
            >
              <AddBusinessIcon className="text-white" style={{ fontSize: '2.5rem' }} />
            </div>
            
            <h1 
              className="text-5xl font-bold mb-4"
              style={{ color: COLORS.primary }}
            >
              Create New Order
            </h1>
            
            <div 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2"
              style={{ 
                backgroundColor: 'rgba(11, 40, 99, 0.05)',
                borderColor: COLORS.primary 
              }}
            >
              <BusinessCenterIcon style={{ color: COLORS.primary, fontSize: '1.25rem' }} />
              <span className="font-medium" style={{ color: COLORS.primary }}>
                Order Management System
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(11, 40, 99, 0.02)'
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: COLORS.primary }}
              >
                <BusinessCenterIcon style={{ color: COLORS.secondary }} />
                Order Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="Reference"
                  fullWidth
                  value={order.key_ref}
                  onChange={(e) => handleChange('key_ref', e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
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
                  InputProps={{
                    startAdornment: <CalendarTodayIcon style={{ color: COLORS.secondary, marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
                <TextField
                  label="Address"
                  fullWidth
                  value={order.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <HomeIcon style={{ color: COLORS.secondary, marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
                <TextField
                  label="Weight (lb)"
                  type="number"
                  fullWidth
                  value={order.weight}
                  onChange={(e) => handleChange('weight', Number(e.target.value))}
                  required
                  inputProps={{ step: "any" }}
                  InputProps={{
                    startAdornment: <ScaleIcon style={{ color: COLORS.secondary, marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                borderColor: COLORS.secondary,
                backgroundColor: 'rgba(240, 159, 82, 0.02)'
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: COLORS.primary }}
              >
                <LocationOnIcon style={{ color: COLORS.secondary }} />
                Location Details
              </h2>
              <div className="space-y-6">
                {!editingLocation && continuedOrder ? (
                  <div className="flex items-center gap-2">
                    <TextField
                      label="Location"
                      fullWidth
                      value={continuedOrder.state_usa}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(240, 159, 82, 0.05)',
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setEditingLocation(true)}
                      startIcon={<EditIcon />}
                      sx={{
                        borderColor: COLORS.secondary,
                        color: COLORS.secondary,
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          backgroundColor: 'rgba(240, 159, 82, 0.1)',
                        },
                        py: 1.5,
                        px: 3,
                        borderWidth: 2,
                        borderRadius: 2,
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Autocomplete
                      options={countries}
                      getOptionLabel={option => option.name}
                      loading={loadingCountries}
                      value={country}
                      onChange={(_, value) => {
                        setCountry(value);
                        setInitializingLocation(false);
                      }}
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
                                {loadingCountries ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: COLORS.primary,
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: COLORS.primary,
                            },
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
                                  {loadingStatesList ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                  borderColor: COLORS.primary,
                                },
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: COLORS.primary,
                              },
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
                                  {loadingCitiesList ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                  borderColor: COLORS.primary,
                                },
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: COLORS.primary,
                              },
                            }}
                          />
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(11, 40, 99, 0.02)'
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: COLORS.primary }}
              >
                <BusinessCenterIcon style={{ color: COLORS.secondary }} />
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            {loadingJobs ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: COLORS.primary,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: COLORS.primary,
                        },
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
                            {loadingCf ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: COLORS.primary,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: COLORS.primary,
                        },
                      }}
                    />
                  )}
                />
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                borderColor: COLORS.secondary,
                backgroundColor: 'rgba(240, 159, 82, 0.02)'
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: COLORS.primary }}
              >
                <PersonIcon style={{ color: COLORS.secondary }} />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="First Name"
                  fullWidth
                  value={order.person.first_name}
                  onChange={(e) => handlePersonChange('first_name', e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  value={order.person.last_name}
                  onChange={(e) => handlePersonChange('last_name', e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={order.person.email}
                  onChange={(e) => handlePersonChange('email', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: COLORS.primary,
                    },
                  }}
                />
                <div className="phone-input-container">
                  <PhoneInput
                    country={'us'}
                    value={order.person.phone}
                    onChange={phone => handlePersonChange('phone', phone)}
                    inputProps={{
                      name: 'phone',
                      required: true,
                      autoFocus: false,
                    }}
                    inputStyle={{ 
                      width: '100%',
                      height: '56px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '8px',
                      paddingLeft: '48px'
                    }}
                    buttonStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px',
                    }}
                    specialLabel="Phone"
                  />
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl border-2"
              style={{ 
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(11, 40, 99, 0.02)'
              }}
            >
              <h2 
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: COLORS.primary }}
              >
                <UploadFileIcon style={{ color: COLORS.secondary }} />
                Dispatch Ticket
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Button
                    variant="outlined"
                    component="label"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<UploadFileIcon />}
                    sx={{
                      borderColor: COLORS.secondary,
                      color: COLORS.secondary,
                      '&:hover': {
                        borderColor: COLORS.secondary,
                        backgroundColor: 'rgba(240, 159, 82, 0.1)',
                      },
                      py: 1.5,
                      px: 3,
                      borderWidth: 2,
                      borderRadius: 2,
                    }}
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
                  
                  {dispatchTicketFile && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDispatchTicketFile(null);
                        setDispatchTicketPreview(null);
                      }}
                      startIcon={<DeleteOutlineIcon />}
                      sx={{
                        borderColor: COLORS.error,
                        color: COLORS.error,
                        '&:hover': {
                          borderColor: COLORS.error,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                        py: 1.5,
                        px: 3,
                        borderWidth: 2,
                        borderRadius: 2,
                      }}
                    >
                      Remove ticket
                    </Button>
                  )}
                </div>
                
                {dispatchTicketPreview && (
                  <div className="mt-4">
                    <div 
                      className="inline-block p-3 rounded-xl border-2"
                      style={{ 
                        backgroundColor: 'rgba(240, 159, 82, 0.05)',
                        borderColor: COLORS.secondary 
                      }}
                    >
                      <img
                        src={dispatchTicketPreview}
                        alt="Dispatch Ticket Preview"
                        className="max-w-xs max-h-48 object-contain rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {successMsg && (
              <div 
                className="px-6 py-4 rounded-xl border-2 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: COLORS.success 
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.success }}
                >
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="font-semibold" style={{ color: COLORS.success }}>
                  {successMsg}
                </span>
              </div>
            )}
            
            {errorMsg && (
              <div 
                className="px-6 py-4 rounded-xl border-2 flex items-center gap-3"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: COLORS.error 
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.error }}
                >
                  <span className="text-white font-bold">✕</span>
                </div>
                <span className="font-semibold" style={{ color: COLORS.error }}>
                  {errorMsg}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddBusinessIcon />}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#091d47',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(11, 40, 99, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: '#d1d5db',
                    color: '#6b7280',
                  },
                  py: 2,
                  px: 6,
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  minWidth: '200px',
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;