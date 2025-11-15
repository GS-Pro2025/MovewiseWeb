/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, CreditCard } from 'lucide-react';
import { getPersonIDTypes, IDType } from '../service/PersonService';
import { enqueueSnackbar } from 'notistack';

interface IDTypePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const PRIMARY = "#0B2863";
const ACCENT = "#FFE67B";
const SURFACE = "#ffffff";

const IDTypePicker: React.FC<IDTypePickerProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "Select ID Type",
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [idTypes, setIdTypes] = useState<IDType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Load ID types on component mount
  useEffect(() => {
    const loadIDTypes = async () => {
      try {
        setLoading(true);
        const response = await getPersonIDTypes();
        
        if (response.status === 'success') {
          setIdTypes(response.data);
        } else {
          throw new Error(response.messUser || 'Failed to load ID types');
        }
      } catch (error: any) {
        console.error('Error loading ID types:', error);
        enqueueSnackbar(error.message || 'Error loading ID types', { variant: 'error' });
        
        // Fallback to default types
        setIdTypes([
          { value: "id_card", label: "ID Card" },
          { value: "driver_license", label: "Driver's License" },
          { value: "passport", label: "Passport" },
          { value: "green_card", label: "Green Card" },
          { value: "social_security", label: "Social Security" },
          { value: "other", label: "Other" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadIDTypes();
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400; // Estimated max height of dropdown
      
      // Space available below and above the button
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // If there's not enough space below but enough above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter types based on search
  const filteredTypes = idTypes.filter(type =>
    type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected type label
  const selectedType = idTypes.find(type => type.value === value);
  const selectedLabel = selectedType?.label || placeholder;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSearchTerm("");
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setShowDropdown(!showDropdown);
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setShowDropdown(false);
    setSearchTerm("");
  };

  return (
    <div className={className}>
      <div ref={dropdownRef} className="relative" style={{ minWidth: 200 }}>
        {/* Main Button */}
        <div
          ref={buttonRef}
          className={`rounded-lg p-3 border shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
          }`}
          style={{
            background: disabled ? '#f8fafc' : `linear-gradient(180deg, ${SURFACE}, #f6f8fb)`,
            border: `2px solid ${PRIMARY}`,
            borderColor: disabled ? '#d1d5db' : PRIMARY
          }}
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          role="button"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className="p-2 rounded-md flex items-center justify-center"
              style={{ 
                background: disabled ? '#e5e7eb' : ACCENT, 
                borderRadius: 8 
              }}
              aria-hidden
            >
              <CreditCard size={16} color={disabled ? '#9ca3af' : PRIMARY} />
            </div>
            <div className="text-left flex-1">
              <div className="text-xs text-gray-500">ID Type</div>
              <div 
                className={`text-sm font-medium ${
                  selectedType ? 'text-gray-900' : 'text-gray-400'
                }`}
                style={{ color: selectedType && !disabled ? PRIMARY : undefined }}
              >
                {selectedLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Clear selection"
                title="Clear"
              >
                <X size={14} color={PRIMARY} />
              </button>
            )}
            
            <span className="p-1 rounded-md" title="Open selector" aria-hidden>
              <ChevronDown 
                size={18} 
                color={disabled ? '#9ca3af' : PRIMARY} 
                className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              />
            </span>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && !disabled && (
          <div
            className={`absolute z-50 left-0 w-full rounded-lg shadow-lg ${
              dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            style={{ 
              background: SURFACE, 
              border: `1px solid ${PRIMARY}`,
              minWidth: '300px',
              maxHeight: '350px'
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold" style={{ color: PRIMARY }}>
                  Select ID Type
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={16} color={PRIMARY} />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search ID types..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  style={{ borderColor: '#e5e7eb', color: PRIMARY }}
                  autoFocus
                />
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">Loading ID types...</div>
                </div>
              )}

              {/* Options List */}
              {!loading && (
                <div className="max-h-64 overflow-y-auto">
                  {filteredTypes.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-400">
                        {searchTerm ? `No results for "${searchTerm}"` : 'No ID types available'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleSelect(type.value)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-3"
                          style={{
                            backgroundColor: value === type.value ? `${PRIMARY}10` : 'transparent',
                            borderLeft: value === type.value ? `3px solid ${PRIMARY}` : '3px solid transparent'
                          }}
                        >
                          <CreditCard size={16} color={PRIMARY} />
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: PRIMARY }}>
                              {type.label}
                            </div>
                          </div>
                          {value === type.value && (
                            <div className="text-xs text-green-600 font-medium">Selected</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IDTypePicker;