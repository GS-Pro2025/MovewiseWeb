import React from 'react';
import { X } from 'lucide-react';
import { LocationData, generateGoogleMapsUrl } from '../../service/mapsServices';

interface LocationDialogProps {
  location: LocationData | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const LocationDialog: React.FC<LocationDialogProps> = ({
  location,
  isOpen,
  onClose,
  title = 'Location Map',
}) => {
  if (!isOpen || !location) return null;

  const mapsUrl = generateGoogleMapsUrl(location, 'embed');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600">{location.address}</p>
          </div>
          <button
            onClick={onClose}
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

        {/* Footer with coordinates */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between text-sm">
          <div className="text-gray-700">
            <span className="font-semibold">Coordinates:</span> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
          <button
            onClick={() => {
              const directUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
              window.open(directUrl, '_blank');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Open in Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationDialog;
