/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Autocomplete, CircularProgress } from "@mui/material";
import { formatDateForAPI } from "../../utils/dateUtils";
import { createWorkhouseOrder, fetchCustomerFactories } from "../data/WarehouseRepository";
import { enqueueSnackbar } from "notistack";
import type { CustomerFactoryModel } from "../domain/CustomerFactoryModel";

const DEFAULT_STATUS = "Pending";
const DEFAULT_PERSON_ID = 7;
const DEFAULT_JOB = 5;

const CreateWarehouseView = () => {
  const [date, setDate] = useState(formatDateForAPI(new Date()));
  const [dispatchTicket, setDispatchTicket] = useState<File | null>(null);
  const [dispatchTicketPreview, setDispatchTicketPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer factories
  const [factories, setFactories] = useState<CustomerFactoryModel[]>([]);
  const [factoryLoading, setFactoryLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState<CustomerFactoryModel | null>(null);

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
    try {
      await createWorkhouseOrder({
        date,
        status: DEFAULT_STATUS,
        person_id: DEFAULT_PERSON_ID,
        job: DEFAULT_JOB,
        customer_factory: selectedFactory.id_factory,
        dispatch_ticket: dispatchTicketString || null,
      });
      enqueueSnackbar("Warehouse order created successfully!", { variant: "success" });
      setDispatchTicket(null);
      setDispatchTicketPreview(null);
    } catch (err: any) {
      enqueueSnackbar(err.message || "Error creating warehouse order", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

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