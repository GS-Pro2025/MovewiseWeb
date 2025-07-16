/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { TextField, Button, Autocomplete, CircularProgress } from "@mui/material";
import { formatDateForAPI } from "../../utils/dateUtils";
import { createWorkhouseOrder, fetchCustomerFactories } from "../data/WarehouseRepository";
import { enqueueSnackbar } from "notistack";
import type { CustomerFactoryModel } from "../domain/CustomerFactoryModel";
import { useNavigate } from "react-router-dom";
import { fetchCountries, fetchStates, fetchCities } from "../../createOrder/repository/repositoryLocation";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ClearIcon from "@mui/icons-material/Clear";

const DEFAULT_STATUS = "Pending";
const DEFAULT_PERSON_ID = 7;
const DEFAULT_JOB = 5;

type LocationStep = 'country' | 'state' | 'city';

const CreateWarehouseView = () => {
  const [date, setDate] = useState(formatDateForAPI(new Date()));
  const [dispatchTicket, setDispatchTicket] = useState<File | null>(null);
  const [dispatchTicketPreview, setDispatchTicketPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer factories
  const [factories, setFactories] = useState<CustomerFactoryModel[]>([]);
  const [factoryLoading, setFactoryLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState<CustomerFactoryModel | null>(null);
  const navigate = useNavigate();

  // Location states
  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [locationStep, setLocationStep] = useState<LocationStep>('country');

  // Load countries on mount
  useEffect(() => {
    fetchCountries().then((countries) => {
      setCountries(countries.map(c => ({ country: c.name })));
    });
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (country) {
      fetchStates(country).then(setStates);
      setState('');
      setCities([]);
      setCity('');
      setLocationStep('state');
    }
  }, [country]);

  // Load cities when state changes
  useEffect(() => {
    if (country && state) {
      fetchCities(country, state).then(setCities);
      setCity('');
      setLocationStep('city');
    }
  }, [country, state]);

  // Reset everything if input is cleared
  useEffect(() => {
    if (!country) {
      setState('');
      setCity('');
      setStates([]);
      setCities([]);
      setLocationStep('country');
    } else if (!state) {
      setCity('');
      setCities([]);
      setLocationStep('state');
    } else if (!city) {
      setLocationStep('city');
    }
  }, [country, state, city]);

  // Build location string (for state_usa field)
  const locationString = useMemo(() => {
    if (!country) return '';
    let loc = country;
    if (state) loc += ` - ${state}`;
    if (city) loc += ` - ${city}`;
    return loc;
  }, [country, state, city]);

  useEffect(() => {
    setFactoryLoading(true);
    fetchCustomerFactories()
      .then((data) => {
        setFactories(data);
        setSelectedFactory(data[0] || null);
      })
      .catch(() => {
        enqueueSnackbar("Error loading customer factories", { variant: "error" });
      })
      .finally(() => setFactoryLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDispatchTicket(file);
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

    if (dispatchTicket && dispatchTicket.size > 5 * 1024 * 1024) {
      setLoading(false);
      enqueueSnackbar('Sorry, the image cannot be larger than 5mb.', { variant: 'error' });
      return;
    }

    let dispatchTicketString = '';
    if (dispatchTicket) {
      dispatchTicketString = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(dispatchTicket);
      });
    }
    if (!selectedFactory) {
      enqueueSnackbar('Please select a customer factory.', { variant: 'error' });
      setLoading(false);
      return;
    }

    if (!locationString) {
      enqueueSnackbar('Please select a location.', { variant: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await createWorkhouseOrder({
        date,
        status: DEFAULT_STATUS,
        person_id: DEFAULT_PERSON_ID,
        job: DEFAULT_JOB,
        customer_factory: selectedFactory.id_factory,
        dispatch_ticket: dispatchTicketString || null,
        state_usa: locationString, // Enviar la ubicación construida
      });
      enqueueSnackbar("Warehouse order created successfully!", { variant: "success" });
      setDispatchTicket(null);
      setDispatchTicketPreview(null);

      // Redirige a asignar operadores usando la key de la orden creada
      const orderKey = response?.key || response?.id || response?.orderKey;
      if (orderKey) {
        navigate(`/add-operators-to-order/${orderKey}`);
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || "Error creating warehouse order", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic options and labels based on step
  let options: any[] = [];
  let getOptionLabel: (option: any) => string = () => '';
  let label = '';
  let value: any = null;

  if (locationStep === 'country') {
    options = countries;
    getOptionLabel = o => o.country;
    label = 'Country';
    value = countries.find(c => c.country === country) || null;
  } else if (locationStep === 'state') {
    options = states;
    getOptionLabel = o => o.name;
    label = 'State';
    value = states.find(s => s.name === state) || null;
  } else if (locationStep === 'city') {
    options = cities;
    getOptionLabel = o => o;
    label = 'City';
    value = city || null;
  }

  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white/0 backdrop-blur-lg border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in fade-in duration-700">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse" style={{ backgroundSize: '200% 100%' }}></div>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <WarehouseIcon className="text-white text-4xl" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Create Warehouse Order
            </h1>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50/80 rounded-full border border-blue-200">
              <BusinessIcon className="text-blue-600 text-lg" />
              <span className="text-blue-700 font-medium">Warehouse Management System</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Order Information Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                📅 Order Information
              </h2>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                className="bg-white/90 rounded-lg"
              />
            </div>
            
            {/* Location Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                <LocationOnIcon className="text-blue-600" /> Location Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Autocomplete
                      options={options}
                      getOptionLabel={getOptionLabel}
                      value={value}
                      onChange={(_, newValue) => {
                        if (newValue === null) {
                          // Si el usuario borra el input, retrocede un paso
                          if (locationStep === 'city') {
                            setCity('');
                            setLocationStep('state');
                          } else if (locationStep === 'state') {
                            setState('');
                            setLocationStep('country');
                          } else if (locationStep === 'country') {
                            setCountry('');
                          }
                        } else {
                          // Selección normal
                          if (locationStep === 'country') {
                            setCountry(newValue.country);
                          } else if (locationStep === 'state') {
                            setState(newValue.name);
                          } else if (locationStep === 'city') {
                            setCity(newValue);
                          }
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={label}
                          placeholder={`Select ${label.toLowerCase()}`}
                          fullWidth
                          className="bg-white/90 rounded-lg"
                        />
                      )}
                      isOptionEqualToValue={(option, value) => getOptionLabel(option) === getOptionLabel(value)}
                      disableClearable={false}
                      disabled={locationStep === 'state' && !country}
                    />
                  </div>
                  {/* Clear button */}
                  {(country || state || city) && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setCountry('');
                        setState('');
                        setCity('');
                        setLocationStep('country');
                      }}
                      startIcon={<ClearIcon />}
                      className="!py-3 !px-4 !border-2 !rounded-xl !transition-all !duration-300"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {/* Show constructed string */}
                {locationString && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-700 font-medium text-sm">
                      📍 Selected Location: <span className="font-semibold">{locationString}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Factory Section */}
            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                🏭 Customer Factory
              </h2>
              <Autocomplete
                options={factories}
                getOptionLabel={(option) => option.name}
                value={selectedFactory}
                onChange={(_, value) => setSelectedFactory(value)}
                loading={factoryLoading}
                isOptionEqualToValue={(option, value) => option.id_factory === value.id_factory}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Factory"
                    fullWidth
                    className="bg-white/90 rounded-lg"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {factoryLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
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
                    startIcon={<UploadFileIcon />}
                    className="!py-3 !px-6 !text-base !border-2 !border-blue-300 !text-blue-600 !hover:bg-blue-50 !rounded-xl !transition-all !duration-300"
                  >
                    {dispatchTicket ? "Image selected" : "Upload Dispatch Ticket"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  
                  {dispatchTicket && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setDispatchTicket(null);
                        setDispatchTicketPreview(null);
                      }}
                      startIcon={<DeleteOutlineIcon />}
                      className="!py-3 !px-6 !text-base !border-2 !rounded-xl !transition-all !duration-300"
                    >
                      Remove ticket
                    </Button>
                  )}
                </div>
                
                {dispatchTicket && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-700 font-medium text-sm">
                      📎 Selected: <span className="font-semibold">{dispatchTicket.name}</span>
                    </p>
                  </div>
                )}
                
                {dispatchTicketPreview && (
                  <div className="mt-4">
                    <div className="inline-block p-3 bg-gray-100 rounded-xl">
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

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <WarehouseIcon />}
                className="!py-4 !px-8 !text-lg !font-semibold !bg-gradient-to-r !from-blue-600 !to-purple-600 !hover:from-blue-700 !hover:to-purple-700 !transform !transition-all !duration-300 !hover:-translate-y-1 !hover:shadow-xl !rounded-xl !min-w-[200px]"
              >
                {loading ? "Creating Warehouse Order..." : "Create Warehouse Order"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWarehouseView;