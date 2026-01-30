import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";

interface YearPickerProps {
  year: number;
  onYearSelect: (year: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

const PRIMARY = "#0B2863";
const ACCENT = "#FFE67B";
const SURFACE = "#ffffff";

const YearPicker: React.FC<YearPickerProps> = ({ 
  year, 
  onYearSelect, 
  min = 2015, 
  max = new Date().getFullYear() + 2, 
  className,
  disabled = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'input'>('select');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState<string>(year.toString());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue(year.toString());
  }, [year]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) setShowDropdown(!showDropdown);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const prevYear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (year > min) onYearSelect(year - 1);
  };

  const nextYear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (year < max) onYearSelect(year + 1);
  };

  const commitInput = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onYearSelect(parsed);
    } else {
      setInputValue(year.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitInput();
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setInputValue(year.toString());
      setShowDropdown(false);
    }
  };

  // Generate years for grid view
  const generateYearGrid = () => {
    const years = [];
    for (let y = min; y <= max; y++) {
      years.push(y);
    }
    return years;
  };

  const yearGrid = generateYearGrid();
  const currentYear = new Date().getFullYear();

  return (
    <div className={className}>
      <div ref={dropdownRef} className="relative w-full">
      <label className="block text-xs font-bold text-[#0B2863] mb-1">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            Year
          </div>
        </label>
        <div
          className={`rounded-lg p-2  flex items-center justify-between gap-2 w-full transition-all duration-200 bg-white ${
            disabled 
              ? 'cursor-not-allowed bg-gray-100 opacity-50' 
              : 'cursor-pointer hover:shadow-md'
          }`}
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          role="button"
          translate="no"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                onClick={prevYear}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Previous year"
                disabled={disabled || year <= min}
                className="flex-shrink-0"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: `1px solid ${PRIMARY}`,
                  background: disabled || year <= min ? '#f1f5f9' : SURFACE,
                  color: PRIMARY,
                  cursor: disabled || year <= min ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={12} />
              </button>

              <div className="flex-1 text-center font-bold text-sm" style={{ color: PRIMARY }}>
                {year}
              </div>

              <button
                onClick={nextYear}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Next year"
                disabled={disabled || year >= max}
                className="flex-shrink-0"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: `1px solid ${PRIMARY}`,
                  background: disabled || year >= max ? '#f1f5f9' : SURFACE,
                  color: PRIMARY,
                  cursor: disabled || year >= max ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex-shrink-0">
              <ChevronDown
                size={16}
                style={{ 
                  color: PRIMARY, 
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          </div>
        </div>

        {showDropdown && !disabled && (
          <div
            className="absolute z-50 left-0 right-0 mt-2 rounded-lg shadow-lg max-w-full"
            style={{ background: SURFACE, border: `1px solid ${PRIMARY}` }}
            translate="no"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold" style={{ color: PRIMARY }}>
                  Select year ({min}-{max})
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode(viewMode === 'select' ? 'input' : 'select')}
                    className="px-2 py-1 text-xs rounded font-medium transition-all duration-200 hover:shadow-sm"
                    style={{ background: '#f1f5f9', color: PRIMARY }}
                    title={`Switch to ${viewMode === 'select' ? 'input' : 'grid'} mode`}
                  >
                    {viewMode === 'select' ? 'Input' : 'Grid'}
                  </button>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={14} color={PRIMARY} />
                  </button>
                </div>
              </div>

              {viewMode === 'select' ? (
                <>
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    <button 
                      onClick={() => { onYearSelect(min); setShowDropdown(false); }} 
                      className="px-2 py-1 text-xs rounded font-medium transition-all duration-200 hover:shadow-sm" 
                      style={{ background: '#f1f5f9', color: PRIMARY }}
                    >
                      First ({min})
                    </button>
                    <button 
                      onClick={() => { onYearSelect(currentYear); setShowDropdown(false); }} 
                      className="px-2 py-1 text-xs rounded font-medium transition-all duration-200 hover:shadow-sm" 
                      style={{ background: ACCENT, color: PRIMARY }}
                    >
                      Current ({currentYear})
                    </button>
                    <button 
                      onClick={() => { onYearSelect(max); setShowDropdown(false); }} 
                      className="px-2 py-1 text-xs rounded font-medium transition-all duration-200 hover:shadow-sm" 
                      style={{ background: '#f1f5f9', color: PRIMARY }}
                    >
                      Last ({max})
                    </button>
                  </div>

                  <div 
                    className="custom-scrollbar grid gap-1 max-h-48 overflow-y-auto p-1" 
                    style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
                  >
                    {yearGrid.map((y) => (
                      <button
                        key={y}
                        onClick={() => { onYearSelect(y); setShowDropdown(false); }}
                        className="p-2 text-xs rounded font-medium transition-all duration-200 hover:shadow-sm text-center"
                        style={{
                          background: y === year ? PRIMARY : y === currentYear ? ACCENT : '#f8fafc',
                          color: y === year ? 'white' : PRIMARY,
                          border: `1px solid ${y === year ? PRIMARY : 'transparent'}`
                        }}
                      >
                        {y}
                        {y === currentYear && y !== year && (
                          <div className="text-xs opacity-75 mt-0.5">current</div>
                        )}
                        {y === year && (
                          <div className="text-xs opacity-90 mt-0.5">selected</div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyPress}
                    onBlur={() => { commitInput(); setShowDropdown(false); }}
                    className="w-full px-3 py-2 rounded-md border text-sm font-bold"
                    style={{ borderColor: PRIMARY, textAlign: 'center', color: PRIMARY }}
                    placeholder={`${min}-${max}`}
                    aria-label="Enter year"
                    autoFocus
                    min={min}
                    max={max}
                  />
                  <div className="flex justify-between text-xs" style={{ color: PRIMARY }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} color={PRIMARY} />
                      <span>Press Enter</span>
                    </div>
                    <div className="text-right">Valid: {min}-{max}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${PRIMARY};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #08305a;
        }
      `}</style>
    </div>
  );
};

export default YearPicker;