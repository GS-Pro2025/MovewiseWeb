/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
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
  const [loadingStates, setLoadingStates] = useState(false);
  console.log("States:", states);
  console.log("loadingStates:", loadingStates);
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

  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then(setCountries)
      .finally(() => setLoadingCountries(false));
  }, []);

  // Solo cargar estados si no estamos inicializando desde continuedOrder
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

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (country && state && !initializingLocation) {
      setLoadingCitiesList(true);
      fetchCities(country.name, state.name)
        .then(setCitiesList)
        .finally(() => setLoadingCitiesList(false));
      setCity(null);
    }
  }, [country, state, initializingLocation]);

  // Este useEffect inicializa los valores desde continuedOrder SOLO UNA VEZ
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

      // Country
      const foundCountry = countries.find(c => c.name === countryName);
      if (foundCountry) setCountry(foundCountry);

      // State
      const foundState = statesList.find(s => s.name === stateName);
      if (foundState) setState(foundState);

      // City
      const foundCity = citiesList.find(c => c === cityName);
      if (foundCity) setCity(foundCity);

      // Job
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

  // Este useEffect va después de cargar jobs y states
  useEffect(() => {
    if (continuedOrder) {
      // JOB
      if (
        continuedOrder.job &&
        !jobs.some((j) => j.id === continuedOrder.job)
      ) {
        setJobs((prev) => [
          ...prev,
          { id: continuedOrder.job, name: String(continuedOrder.job) },
        ]);
      }
      // LOCATION (state_usa)
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

  useEffect(() => {
    if (continuedOrder && jobs.length > 0) {
      // Busca el job por nombre exacto (ignora mayúsculas/minúsculas y espacios)
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

  return (
    <div className="min-h-screen py-8 px-4 flex items-start justify-center">
      <div className="w-full max-w-5xl">
        <div className="bg-white/0 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in fade-in duration-700">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-pulse"></div>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <AddBusinessIcon className="text-white text-4xl" />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Create New Order
            </h1>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50/80 rounded-full border border-blue-200">
              <BusinessCenterIcon className="text-blue-600 text-lg" />
              <span className="text-blue-700 font-medium">Order Management System</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Order Information Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                📋 Order Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="Reference"
                  fullWidth
                  value={order.key_ref}
                  onChange={(e) => handleChange('key_ref', e.target.value)}
                  required
                  className="bg-white/90 rounded-lg"
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
                  className="bg-white/90 rounded-lg"
                />
                <div className="md:col-span-1">
                  <TextField
                    label="Address"
                    fullWidth
                    value={order.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    required
                    className="bg-white/90 rounded-lg"
                  />
                </div>
                <TextField
                  label="Weight (lb)"
                  type="number"
                  fullWidth
                  value={order.weight}
                  onChange={(e) => handleChange('weight', Number(e.target.value))}
                  required
                  inputProps={{ step: "any" }}
                  className="bg-white/90 rounded-lg"
                />
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                <LocationOnIcon className="text-blue-600" /> Location Details
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
                      className="bg-white/90 rounded-lg"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setEditingLocation(true)}
                      startIcon={<EditIcon />}
                      className="!py-3 !px-4 !text-base !border-2 !rounded-xl"
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
                      onChange={(_, value) => setCountry(value)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Country"
                          fullWidth
                          required
                          className="bg-white/90 rounded-lg"
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
                            className="bg-white/90 rounded-lg"
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
                            className="bg-white/90 rounded-lg"
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
                  </div>
                )}
              </div>
            </div>

            {/* Business Details Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                🏢 Business Details
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
                      className="bg-white/90 rounded-lg"
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
                      className="bg-white/90 rounded-lg"
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
              </div>
            </div>

            {/* Customer Information Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                <PersonIcon className="text-blue-600" /> Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="First Name"
                  fullWidth
                  value={order.person.first_name}
                  onChange={(e) => handlePersonChange('first_name', e.target.value)}
                  required
                  className="bg-white/90 rounded-lg"
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  value={order.person.last_name}
                  onChange={(e) => handlePersonChange('last_name', e.target.value)}
                  required
                  className="bg-white/90 rounded-lg"
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={order.person.email}
                  onChange={(e) => handlePersonChange('email', e.target.value)}
                  className="bg-white/90 rounded-lg"
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
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '8px',
                      paddingLeft: '48px'
                    }}
                    buttonStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px',
                    }}
                    specialLabel="Phone"
                  />
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                <UploadFileIcon className="text-blue-600" /> Dispatch Ticket
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Button
                    variant="outlined"
                    component="label"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<UploadFileIcon />}
                    className="!py-3 !px-6 !text-base !border-2 !border-blue-300 !text-blue-600 !hover:bg-blue-50 !rounded-xl !transition-all !duration-300"
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
                      color="error"
                      onClick={() => {
                        setDispatchTicketFile(null);
                        setDispatchTicketPreview(null);
                      }}
                      startIcon={<DeleteOutlineIcon />}
                      className="!py-3 !px-6 !text-base !border-2 !rounded-xl !transition-all !duration-300"
                    >
                      Remove ticket
                    </Button>
                  )}
                </div>
                
                {dispatchTicketPreview && (
                  <div className="mt-4">
                    <div className="inline-block p-2 bg-gray-100 rounded-xl">
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

            {/* Messages */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  {successMsg}
                </div>
              </div>
            )}
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddBusinessIcon />}
                className="!py-4 !px-8 !text-lg !font-semibold !bg-gradient-to-r !from-blue-600 !to-purple-600 !hover:from-blue-700 !hover:to-purple-700 !transform !transition-all !duration-300 !hover:-translate-y-1 !hover:shadow-xl !rounded-xl !min-w-[200px]"
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