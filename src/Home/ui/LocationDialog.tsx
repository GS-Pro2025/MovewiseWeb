import React from 'react';
import { X, Navigation } from 'lucide-react';
import { LocationData, RouteData, generateGoogleMapsUrl, generateGoogleMapsDirectionsUrl } from '../../service/mapsServices';

interface LocationDialogProps {
  location?: LocationData | null;
  route?: RouteData | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const LocationDialog: React.FC<LocationDialogProps> = ({
  location,
  route,
  isOpen,
  onClose,
  title,
}) => {
  if (!isOpen || (!location && !route)) return null;

  const isRoute = !!route;
  const mapsUrl = isRoute 
    ? generateGoogleMapsDirectionsUrl(route) 
    : generateGoogleMapsUrl(location || null, 'embed');

  const displayTitle = title || (isRoute ? 'Route Map' : 'Location Map');
  const displayAddress = isRoute 
    ? `${route!.origin.address} → ${route!.destination.address}`
    : location?.address;

  // Keep original overflow so we can restore it on close
  const originalOverflowRef = React.useRef<string | null>(null);

  const applyBlur = () => {
    originalOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const filtersContainer = document.querySelector('.week-dropdown-container');
    const statisticsPanel = document.querySelector('[data-statistics-panel]');
    const tableContainer = document.querySelector('[data-table-container]');

    if (filtersContainer) (filtersContainer as HTMLElement).style.filter = 'blur(5px)';
    if (statisticsPanel) (statisticsPanel as HTMLElement).style.filter = 'blur(5px)';
    if (tableContainer) (tableContainer as HTMLElement).style.filter = 'blur(5px)';
  };

  const removeBlur = () => {
    // restore overflow
    if (originalOverflowRef.current !== null) {
      document.body.style.overflow = originalOverflowRef.current;
      originalOverflowRef.current = null;
    } else {
      document.body.style.overflow = '';
    }

    // Always attempt to clear filters, even if nodes changed
    const filters = document.querySelectorAll('.week-dropdown-container');
    const stats = document.querySelectorAll('[data-statistics-panel]');
    const tables = document.querySelectorAll('[data-table-container]');

    filters.forEach((el) => (el as HTMLElement).style.filter = '');
    stats.forEach((el) => (el as HTMLElement).style.filter = '');
    tables.forEach((el) => (el as HTMLElement).style.filter = '');
  };

  // Apply blur when the dialog mounts/open and ensure cleanup always removes it
  React.useEffect(() => {
    if (isOpen) {
      applyBlur();
    }

    return () => {
      removeBlur();
    };
  }, [isOpen]);

  // Local close handler ensures we clean up immediately before calling parent onClose
  const handleClose = () => {
    removeBlur();
    onClose();
  };

  const handleOpenInGoogleMaps = () => {
    if (isRoute) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${route!.origin.latitude},${route!.origin.longitude}&destination=${route!.destination.latitude},${route!.destination.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const directUrl = `https://www.google.com/maps?q=${location!.latitude},${location!.longitude}`;
      window.open(directUrl, '_blank');
    }
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 transition-all duration-300"
        onClick={handleClose}
        style={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.6)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9998,
        }}
      ></div>
      
      {/* Modal Dialog */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9999 }}>
        <div 
          className="bg-white rounded-lg shadow-2xl w-11/12 max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto"
          style={{
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              {isRoute && <Navigation size={20} style={{ color: '#0B2863' }} />}
              <div>
                <h2 className="text-lg font-bold text-gray-800">{displayTitle}</h2>
                <p className="text-sm text-gray-600">{displayAddress}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: '400px' }}>
            {mapsUrl ? (
              <iframe
                width="100%"
                height="400"
                style={{ border: 'none' }}
                src={mapsUrl}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">Unable to load map</p>
              </div>
            )}
          </div>

          {/* Footer with coordinates or route details */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between text-sm">
            <div className="text-gray-700">
              {isRoute ? (
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Start:</span> {route!.origin.latitude.toFixed(6)}, {route!.origin.longitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">End:</span> {route!.destination.latitude.toFixed(6)}, {route!.destination.longitude.toFixed(6)}
                  </div>
                </div>
              ) : (
                <span>
                  <span className="font-semibold">Coordinates:</span> {location!.latitude.toFixed(6)}, {location!.longitude.toFixed(6)}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenInGoogleMaps}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Navigation size={14} />
              Open in Google Maps
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default LocationDialog;
