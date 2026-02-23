/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { TextField, Autocomplete, CircularProgress } from "@mui/material";
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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
};

const DEFAULT_STATUS = "Pending";
type LocationStep = 'country' | 'state' | 'city';

const muiSx = {
  '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: COLORS.primary } },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.primary },
};

const CreateWarehouseView = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(formatDateForAPI(new Date()));
  const [dispatchTicket, setDispatchTicket] = useState<File | null>(null);
  const [dispatchTicketPreview, setDispatchTicketPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [factories, setFactories] = useState<CustomerFactoryModel[]>([]);
  const [factoryLoading, setFactoryLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState<CustomerFactoryModel | null>(null);
  const navigate = useNavigate();

  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [locationStep, setLocationStep] = useState<LocationStep>('country');

  useEffect(() => {
    fetchCountries().then((c) => setCountries(c.map(c => ({ country: c.name }))));
  }, []);

  useEffect(() => {
    if (country) {
      fetchStates(country).then(setStates);
      setState(''); setCities([]); setCity(''); setLocationStep('state');
    }
  }, [country]);

  useEffect(() => {
    if (country && state) {
      fetchCities(country, state).then(setCities);
      setCity(''); setLocationStep('city');
    }
  }, [country, state]);

  useEffect(() => {
    if (!country) { setState(''); setCity(''); setStates([]); setCities([]); setLocationStep('country'); }
    else if (!state) { setCity(''); setCities([]); setLocationStep('state'); }
    else if (!city) { setLocationStep('city'); }
  }, [country, state, city]);

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
      .then((data) => { setFactories(data); setSelectedFactory(data[0] || null); })
      .catch(() => enqueueSnackbar(t('createWarehouse.messages.errorLoading'), { variant: "error" }))
      .finally(() => setFactoryLoading(false));
  }, [t]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDispatchTicket(file);
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

    if (dispatchTicket && dispatchTicket.size > 5 * 1024 * 1024) {
      setLoading(false);
      enqueueSnackbar(t('createWarehouse.messages.imageTooLarge'), { variant: 'error' });
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
      enqueueSnackbar(t('createWarehouse.messages.noFactory'), { variant: 'error' });
      setLoading(false); return;
    }
    if (!locationString) {
      enqueueSnackbar(t('createWarehouse.messages.noLocation'), { variant: 'error' });
      setLoading(false); return;
    }

    try {
      const response = await createWorkhouseOrder({
        date, status: DEFAULT_STATUS,
        customer_factory: selectedFactory.id_factory,
        dispatch_ticket: dispatchTicketString || null,
        state_usa: locationString,
      });
      enqueueSnackbar(t('createWarehouse.messages.success'), { variant: "success" });
      setDispatchTicket(null); setDispatchTicketPreview(null);
      const orderKey = response?.data.key;
      if (orderKey) navigate(`/app/add-operators-to-order/${orderKey}`);
    } catch (err: any) {
      enqueueSnackbar(err.message || t('createWarehouse.messages.errorLoading'), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  let options: any[] = [];
  let getOptionLabel: (option: any) => string = () => '';
  let label = '';
  let value: any = null;

  if (locationStep === 'country') {
    options = countries; getOptionLabel = o => o.country;
    label = t('createWarehouse.fields.country');
    value = countries.find(c => c.country === country) || null;
  } else if (locationStep === 'state') {
    options = states; getOptionLabel = o => o.name;
    label = t('createWarehouse.fields.state');
    value = states.find(s => s.name === state) || null;
  } else if (locationStep === 'city') {
    options = cities; getOptionLabel = o => o;
    label = t('createWarehouse.fields.city');
    value = city || null;
  }

  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white/50 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden"
          style={{ borderTop: `4px solid ${COLORS.primary}` }}>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: COLORS.primary }}>
              <WarehouseIcon className="text-white" style={{ fontSize: '2.5rem' }} />
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: COLORS.primary }}>
              {t('createWarehouse.title')}
            </h1>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2"
              style={{ backgroundColor: 'rgba(11, 40, 99, 0.05)', borderColor: COLORS.primary }}>
              <BusinessIcon style={{ color: COLORS.primary, fontSize: '1.25rem' }} />
              <span className="font-medium" style={{ color: COLORS.primary }}>
                {t('createWarehouse.subtitle')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Order Information */}
            <div className="p-6 rounded-2xl border-2"
              style={{ borderColor: COLORS.primary, backgroundColor: 'rgba(11, 40, 99, 0.02)' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                <CalendarTodayIcon style={{ color: COLORS.secondary }} />
                {t('createWarehouse.sections.orderInfo')}
              </h2>
              <TextField label={t('createWarehouse.fields.date')} type="date" value={date}
                onChange={e => setDate(e.target.value)} fullWidth
                InputLabelProps={{ shrink: true }} sx={muiSx} />
            </div>

            {/* Location */}
            <div className="p-6 rounded-2xl border-2"
              style={{ borderColor: COLORS.secondary, backgroundColor: 'rgba(240, 159, 82, 0.02)' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                <LocationOnIcon style={{ color: COLORS.secondary }} />
                {t('createWarehouse.sections.location')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Autocomplete
                      options={options} getOptionLabel={getOptionLabel} value={value}
                      onChange={(_, newValue) => {
                        if (newValue === null) {
                          if (locationStep === 'city') { setCity(''); setLocationStep('state'); }
                          else if (locationStep === 'state') { setState(''); setLocationStep('country'); }
                          else if (locationStep === 'country') { setCountry(''); }
                        } else {
                          if (locationStep === 'country') setCountry(newValue.country);
                          else if (locationStep === 'state') setState(newValue.name);
                          else if (locationStep === 'city') setCity(newValue);
                        }
                      }}
                      renderInput={params => (
                        <TextField {...params} label={label} fullWidth
                          placeholder={t('createWarehouse.fields.selectPlaceholder', { label: label.toLowerCase() })}
                          sx={muiSx} />
                      )}
                      isOptionEqualToValue={(o, v) => getOptionLabel(o) === getOptionLabel(v)}
                      disableClearable={false}
                      disabled={locationStep === 'state' && !country}
                    />
                  </div>
                  {(country || state || city) && (
                    <button type="button"
                      onClick={() => { setCountry(''); setState(''); setCity(''); setLocationStep('country'); }}
                      className="px-4 py-3 rounded-xl border-2 font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-200"
                      style={{ borderColor: COLORS.error, color: COLORS.error }}>
                      <ClearIcon style={{ fontSize: '1.25rem' }} />
                      {t('createWarehouse.buttons.clear')}
                    </button>
                  )}
                </div>
                {locationString && (
                  <div className="rounded-xl p-4 border-2"
                    style={{ backgroundColor: 'rgba(240, 159, 82, 0.1)', borderColor: COLORS.secondary }}>
                    <p className="font-medium text-sm" style={{ color: COLORS.primary }}>
                      <LocationOnIcon style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }} />
                      {t('createWarehouse.fields.selectedLocation')}: <span className="font-semibold">{locationString}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Factory */}
            <div className="p-6 rounded-2xl border-2"
              style={{ borderColor: COLORS.primary, backgroundColor: 'rgba(11, 40, 99, 0.02)' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                <BusinessIcon style={{ color: COLORS.secondary }} />
                {t('createWarehouse.sections.factory')}
              </h2>
              <Autocomplete
                options={factories} getOptionLabel={o => o.name} value={selectedFactory}
                onChange={(_, value) => setSelectedFactory(value)} loading={factoryLoading}
                isOptionEqualToValue={(o, v) => o.id_factory === v.id_factory}
                renderInput={params => (
                  <TextField {...params} label={t('createWarehouse.fields.customerFactory')} fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (<>{factoryLoading ? <CircularProgress sx={{ color: COLORS.primary }} size={20} /> : null}{params.InputProps.endAdornment}</>)
                    }}
                    sx={muiSx} />
                )}
              />
            </div>

            {/* Dispatch Ticket */}
            <div className="p-6 rounded-2xl border-2"
              style={{ borderColor: COLORS.secondary, backgroundColor: 'rgba(240, 159, 82, 0.02)' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: COLORS.primary }}>
                <UploadFileIcon style={{ color: COLORS.secondary }} />
                {t('createWarehouse.sections.dispatch')}
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <button type="button" onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-6 py-3 rounded-xl border-2 font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-200"
                    style={{ borderColor: COLORS.secondary, color: COLORS.secondary }}>
                    <UploadFileIcon />
                    {dispatchTicket ? t('createWarehouse.dispatch.imageSelected') : t('createWarehouse.dispatch.upload')}
                  </button>
                  <input id="file-upload" type="file" accept="image/*" hidden onChange={handleFileChange} />

                  {dispatchTicket && (
                    <button type="button"
                      onClick={() => { setDispatchTicket(null); setDispatchTicketPreview(null); }}
                      className="px-6 py-3 rounded-xl border-2 font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-200"
                      style={{ borderColor: COLORS.error, color: COLORS.error }}>
                      <DeleteOutlineIcon />
                      {t('createWarehouse.dispatch.remove')}
                    </button>
                  )}
                </div>

                {dispatchTicket && (
                  <div className="rounded-xl p-4 border-2"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: COLORS.success }}>
                    <p className="font-medium text-sm" style={{ color: COLORS.success }}>
                      <UploadFileIcon style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }} />
                      {t('createWarehouse.dispatch.selected')}: <span className="font-semibold">{dispatchTicket.name}</span>
                    </p>
                  </div>
                )}

                {dispatchTicketPreview && (
                  <div className="mt-4">
                    <div className="inline-block p-3 rounded-xl border-2"
                      style={{ backgroundColor: 'rgba(240, 159, 82, 0.05)', borderColor: COLORS.secondary }}>
                      <img src={dispatchTicketPreview} alt={t('createWarehouse.dispatch.preview')}
                        className="max-w-xs max-h-48 object-contain rounded-lg shadow-md" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button type="submit" disabled={loading}
                className="w-full py-4 px-8 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-3 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.primary }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                {loading ? (
                  <>
                    <CircularProgress size={24} style={{ color: 'white' }} />
                    {t('createWarehouse.buttons.creating')}
                  </>
                ) : (
                  <>
                    <WarehouseIcon />
                    {t('createWarehouse.buttons.create')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWarehouseView;