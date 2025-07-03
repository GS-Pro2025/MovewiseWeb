/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { Box, Typography, TextField, Button, Autocomplete, CircularProgress } from "@mui/material";
import { formatDateForAPI } from "../../utils/dateUtils";
import { createWorkhouseOrder, fetchCustomerFactories } from "../data/WarehouseRepository";
import { enqueueSnackbar } from "notistack";
import type { CustomerFactoryModel } from "../domain/CustomerFactoryModel";
import { useNavigate } from "react-router-dom";
import { fetchCountries, fetchStates, fetchCities } from "../../createOrder/repository/repositoryLocation";

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
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 5, p: 3, boxShadow: 3, borderRadius: 2, bgcolor: "#fff" }}>
      <Typography variant="h5" gutterBottom>
        Create Warehouse Order
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        
        {/* Location Autocomplete */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Location
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              sx={{ flex: 1 }}
              renderInput={params => (
                <TextField
                  {...params}
                  label={label}
                  placeholder={`Select ${label.toLowerCase()}`}
                  size="small"
                />
              )}
              isOptionEqualToValue={(option, value) => getOptionLabel(option) === getOptionLabel(value)}
              disableClearable={false}
              disabled={locationStep === 'state' && !country}
            />
            {/* Clear button */}
            {(country || state || city) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCountry('');
                  setState('');
                  setCity('');
                  setLocationStep('country');
                }}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Clear
              </Button>
            )}
          </Box>
          {/* Show constructed string */}
          {locationString && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Selected: {locationString}
            </Typography>
          )}
        </Box>

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
              margin="normal"
              fullWidth
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
          sx={{ mt: 2 }}
        />
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mt: 2 }}
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
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected: {dispatchTicket.name}
          </Typography>
        )}
        {dispatchTicketPreview && (
          <img
            src={dispatchTicketPreview}
            alt="Dispatch Ticket"
            style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }}
          />
        )}
        {dispatchTicket && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setDispatchTicket(null);
              setDispatchTicketPreview(null);
            }}
            sx={{ mt: 1 }}
          >
            Remove dispatch ticket
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </form>
    </Box>
  );
};

export default CreateWarehouseView;