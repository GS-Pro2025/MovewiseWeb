/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, CircularProgress } from '@mui/material';
import type { UpdateOrderData } from '../domain/ModelOrderUpdate';
import { fetchCustomerFactories, fetchJobs } from '../data/repositoryOrders';
import { JobModel } from '../domain/JobModel';
import { CustomerFactoryModel } from '../domain/CustomerFactoryModel';
import 'react-phone-input-2/lib/material.css';
import PhoneInput from 'react-phone-input-2';
import { Country, State } from '../../createOrder/models/LocationModels';
import { fetchCities, fetchCountries, fetchStates } from '../../createOrder/repository/repositoryLocation';

interface EditOrderDialogProps {
  open: boolean;
  order: UpdateOrderData | null;
  onClose: () => void;
  onSave: (order: UpdateOrderData) => void;
  onChange: (field: keyof UpdateOrderData | `person.${string}`, value: unknown) => void;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({ open, order, onClose, onSave, onChange }) => {
  console.log('EditOrderDialog rendered with order:', order);
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

  useEffect(() => {
    if (open) {
      fetchJobs()
        .then(setJobs)
        .finally(() => setLoadingJobs(false));
      fetchCustomerFactories()
        .then(setCf)
        .finally(() => setLoadingCf(false));
    }
  }, [open]);

  useEffect(() => {
    // Si abres el modal y hay imagen previa, muéstrala
    if (open && order?.dispatch_ticket && !dispatchTicketFile) {
      setDispatchTicketPreview(order.dispatch_ticket);
    }
    if (!open) {
      setDispatchTicketFile(null);
      setDispatchTicketPreview(null);
    }
  }, [open, order, dispatchTicketFile]);
  // Cargar países al montar
    useEffect(() => {
      setLoadingCountries(true);
      fetchCountries()
        .then(setCountries)
        .finally(() => setLoadingCountries(false));
      console.log('Countries loaded:', countries);
    }, [countries]);
  
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
  const handleChange = useCallback((field: keyof UpdateOrderData, value: any) => {
    onChange(field, value);
  }, [onChange]);

  const prevLocation = useRef<string>("");

  useEffect(() => {
    if (country && state && city) {
      const newLocation = `${country.name}, ${state.name}, ${city}`;
      if (prevLocation.current !== newLocation) {
        prevLocation.current = newLocation;
        handleChange('state_usa', newLocation);
      }
    }
  }, [country, state, city, handleChange]);
  
  const handleDispatchTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDispatchTicketFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDispatchTicketPreview(reader.result as string);
        onChange('dispatch_ticket', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveDispatchTicket = () => {
    setDispatchTicketFile(null);
    setDispatchTicketPreview(null);
    onChange('dispatch_ticket', '');
  };

  if (!order) return null;
  console.log('cf', cf);
  console.log('order.customer_factory', order.customer_factory);
  console.log('order.status', order.status, typeof order.status);
  console.log('order.payStatus', order.payStatus, typeof order.payStatus);


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Order</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label="Key Ref"
            fullWidth
            margin="normal"
            value={order.key_ref}
            onChange={e => onChange('key_ref', e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            value={order.date}
            onChange={e => onChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Distance"
            fullWidth
            margin="normal"
            value={order.distance ?? ''}
            onChange={e => onChange('distance', e.target.value)}
          />
          <TextField
            label="Expense"
            fullWidth
            margin="normal"
            value={order.expense ?? ''}
            onChange={e => onChange('expense', e.target.value)}
          />
          <TextField
            label="Income"
            fullWidth
            margin="normal"
            value={order.income ?? ''}
            onChange={e => onChange('income', e.target.value)}
          />
          <TextField
            label="Weight"
            fullWidth
            margin="normal"
            value={order.weight}
            onChange={e => onChange('weight', e.target.value)}
          />
          {/** location */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, my: 2 }}>
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
          </Box>
          {/* Campos de la persona */}
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={order.person?.first_name ?? ''}
            onChange={e => onChange('person.first_name', e.target.value)}
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={order.person?.last_name ?? ''}
            onChange={e => onChange('person.last_name', e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={order.person?.email ?? ''}
            onChange={e => onChange('person.email', e.target.value)}
          />
          <PhoneInput
              country={'us'}
              value={order.person.phone}
              onChange={phone => onChange('person.phone', phone)}
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: false,
              }}
              inputStyle={{ width: '100%' }}
              specialLabel="Teléfono"
            />
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            value={order.person?.address ?? ''}
            onChange={e => onChange('person.address', e.target.value)}
          />
          <Autocomplete
            options={jobs}
            loading={loadingJobs}
            getOptionLabel={option => `${option.id} - ${option.name}`}
            value={jobs.find(s => s.id === order.job) || null}
            onChange={(_, value) => onChange('job', value ? value.id : '')}
            renderInput={params => (
              <TextField
                {...params}
                label="Job"
                margin="normal"
                fullWidth
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
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <Autocomplete
            options={cf}
            loading={loadingCf}
            getOptionLabel={option => `${option.name}`}
              value={
                cf.length > 0
                  ? cf.find(s => Number(s.id_factory) === Number(order.customer_factory)) || null
                  : null
              }
            onChange={(_, value) => onChange('customer_factory', value ? value.id_factory : '')}
            renderInput={params => (
              <TextField
                {...params}
                label="Company"
                margin="normal"
                fullWidth
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
            isOptionEqualToValue={(option, value) => Number(option.id_factory) === Number(value.id_factory)}
          />
        {/* Campo para editar el dispatch_ticket */}
          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 2 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {dispatchTicketFile || dispatchTicketPreview
              ? 'Change image of dispatch ticket'
              : 'Upload image of dispatch ticket (optional)'}
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
          {(dispatchTicketFile || dispatchTicketPreview) && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveDispatchTicket}
              sx={{ mt: 1 }}
            >
              Remove Dispatch Ticket
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={() => onSave(order)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default EditOrderDialog;


