import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { X, RefreshCw, MapPin, WifiOff } from 'lucide-react';
import {
  fetchOrderOperatorLocations,
  type ActiveOperatorLocation,
} from '../data/repositoryTracking';

import type { TableData } from '../domain/TableData';

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STALE_THRESHOLD_MS = 30_000; // 30 segundos sin actualización → sin señal
const POLL_INTERVAL_MS = 10_000;

interface OrderTrackingDialogProps {
  open: boolean;
  order: TableData | null;
  onClose: () => void;
}

function isStale(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() > STALE_THRESHOLD_MS;
}

function secondsAgo(lastSeen: string): string {
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  return `${mins}m ago`;
}

/** Fits/centers the map whenever the operator list changes. Must live inside MapContainer. */
const MapAutoFit: React.FC<{ operators: ActiveOperatorLocation[] }> = ({ operators }) => {
  const map = useMap();

  useEffect(() => {
    if (operators.length === 0) return;

    // MUI Dialog has a ~300ms open animation. Leaflet calculates container
    // dimensions at mount, which may be 0 while the Dialog is still fading in.
    // invalidateSize() forces a recalculation before setView/fitBounds.
    const timer = setTimeout(() => {
      map.invalidateSize();
      const points = operators.map(
        (op) => [parseFloat(op.latitude), parseFloat(op.longitude)] as [number, number]
      );
      if (points.length === 1) {
        map.setView(points[0], 14, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50], animate: true });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [operators, map]);

  return null;
};

const OrderTrackingDialog: React.FC<OrderTrackingDialogProps> = ({
  open,
  order,
  onClose,
}) => {
  const { t } = useTranslation();
  const [trackedOperators, setTrackedOperators] = useState<ActiveOperatorLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndFilter = useCallback(async () => {
    if (!order) return;
    try {
      const results = await fetchOrderOperatorLocations(order.id);
      setTrackedOperators(results);
      setLastRefresh(new Date());
    } catch {
      // Silent — keep last known state
    } finally {
      setLoading(false);
    }
  }, [order]);

  useEffect(() => {
    if (!open) {
      setTrackedOperators([]);
      setLastRefresh(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setLoading(true);
    fetchAndFilter();
    intervalRef.current = setInterval(fetchAndFilter, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, fetchAndFilter]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchAndFilter();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#0B2863',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
        }}
      >
        <div className="flex items-center gap-2">
          <MapPin size={18} />
          <span className="text-sm font-bold">
            {t('tracking.title')} — {order?.key_ref}
          </span>
          {trackedOperators.length > 0 && (
            <Chip
              label={`${trackedOperators.length} ${t('tracking.activeOperators')}`}
              size="small"
              sx={{ backgroundColor: '#22c55e', color: 'white', fontWeight: 700, fontSize: '0.65rem' }}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          {lastRefresh && (
            <span className="text-xs opacity-70 mr-2">
              {t('tracking.lastRefresh')}: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <IconButton
            size="small"
            onClick={handleManualRefresh}
            disabled={loading}
            sx={{ color: 'white' }}
            title={t('tracking.refresh')}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <X size={16} />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading && trackedOperators.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <CircularProgress size={40} sx={{ color: '#0B2863' }} />
          </div>
        )}

        {!loading && trackedOperators.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-3">
            <WifiOff size={48} style={{ color: '#9ca3af' }} />
            <p className="text-gray-500 text-sm font-medium">{t('tracking.noActiveTracking')}</p>
            <p className="text-gray-400 text-xs">{t('tracking.noActiveTrackingHint')}</p>
          </div>
        )}

        <MapContainer
          key={open ? 'open' : 'closed'}
          center={[20, -75]}
          zoom={3}
          style={{ height: 480, width: '100%' }}
        >
          <MapAutoFit operators={trackedOperators} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {trackedOperators.map((op) => {
            const stale = isStale(op.last_seen);
            const lat = parseFloat(op.latitude);
            const lng = parseFloat(op.longitude);
            const statusColor = stale ? '#ef4444' : '#22c55e';
            const firstName = op.name.split(' ')[0];

            // Truck SVG path (a simple side-view truck outline)
            const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 4v4h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>`;

            const markerIcon = L.divIcon({
              className: '',
              html: `
                <div style="
                  display:flex;
                  flex-direction:column;
                  align-items:center;
                  filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));
                ">
                  <!-- Pin body -->
                  <div style="
                    background:${stale ? '#ef4444' : '#0B2863'};
                    border:3px solid ${statusColor};
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    width:48px;height:48px;
                    display:flex;align-items:center;justify-content:center;
                  ">
                    <div style="transform:rotate(45deg);display:flex;flex-direction:column;align-items:center;gap:1px;">
                      ${truckSvg}
                      ${
                        op.photo
                          ? `<img src="${op.photo}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;border:1px solid white;display:none;" />`
                          : ''
                      }
                    </div>
                  </div>
                  <!-- Name label -->
                  <div style="
                    margin-top:4px;
                    background:${stale ? '#ef4444' : '#0B2863'};
                    color:white;
                    font-size:10px;
                    font-weight:700;
                    padding:2px 6px;
                    border-radius:4px;
                    white-space:nowrap;
                    max-width:80px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  ">${firstName}</div>
                </div>
              `,
              iconSize: [48, 72],
              iconAnchor: [24, 62],
              popupAnchor: [0, -64],
            });

            return (
              <Marker key={op.operator_id} position={[lat, lng]} icon={markerIcon}>
                <Popup>
                  <div className="text-xs min-w-[140px]">
                    <p className="font-bold text-sm mb-1" style={{ color: '#0B2863' }}>
                      {op.name}
                    </p>
                    {op.address && (
                      <p className="text-gray-600 mb-1">📍 {op.address}</p>
                    )}
                    <p className={`font-medium ${stale ? 'text-red-500' : 'text-green-600'}`}>
                      {stale ? `⚠️ ${t('tracking.noSignal')}` : `✅ ${t('tracking.active')}`}
                    </p>
                    <p className="text-gray-500 mt-1">
                      🕐 {secondsAgo(op.last_seen)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingDialog;
