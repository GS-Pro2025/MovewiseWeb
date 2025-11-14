import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";

interface WeekPickerProps {
  week: number;
  onWeekSelect: (week: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const PRIMARY = "#0B2863"; // company navy
const ACCENT = "#FFE67B";  // company yellow
const SURFACE = "#ffffff"; // surface

const WeekPicker: React.FC<WeekPickerProps> = ({ week, onWeekSelect, min = 1, max = 53, className }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'input'>('select');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [inputValue, setInputValue] = useState<string>(week.toString());

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
    setInputValue(week.toString());
  }, [week]);

  const weeks = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter') {
      setShowDropdown(!showDropdown);
    }
  };

  const commitInput = () => {
    if (inputValue === "") {
      setInputValue(week.toString());
      return;
    }
    const w = parseInt(inputValue, 10);
    if (!isNaN(w) && w >= min && w <= max) {
      onWeekSelect(w);
      setInputValue(w.toString());
    } else {
      setInputValue(week.toString());
    }
  };

  const prevWeek = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (week > min) onWeekSelect(week - 1);
  };

  const nextWeek = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (week < max) onWeekSelect(week + 1);
  };

  return (
    <div className={className}>
      <div ref={dropdownRef} className="relative" style={{ minWidth: 140 }}>
        <div
          className="rounded-lg p-3 border shadow-sm flex items-center justify-between gap-3 cursor-pointer"
          style={{
            background: `linear-gradient(180deg, ${SURFACE}, #f6f8fb)`,
            border: `2px solid ${PRIMARY}`
          }}
          onClick={() => setShowDropdown(!showDropdown)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          role="button"
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-md flex items-center justify-center"
              style={{ background: ACCENT, borderRadius: 8 }}
              aria-hidden
            >
              <Calendar size={16} color={PRIMARY} />
            </div>

            <div className="text-left flex items-center gap-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={prevWeek}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Previous week"
                  disabled={week <= min}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: `1px solid ${PRIMARY}`,
                    background: week <= min ? '#f1f5f9' : SURFACE,
                    color: PRIMARY,
                    cursor: week <= min ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="text-left">
                  <div className="text-xs text-gray-500">Period</div>
                  <div className="text-sm font-bold" style={{ color: PRIMARY }}>Week {week}</div>
                </div>

                <button
                  onClick={nextWeek}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Next week"
                  disabled={week >= max}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: `1px solid ${PRIMARY}`,
                    background: week >= max ? '#f1f5f9' : SURFACE,
                    color: PRIMARY,
                    cursor: week >= max ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === 'select' ? 'input' : 'select'); }}
              className="text-xs px-2 py-1 rounded-md border"
              style={{ borderColor: '#e6edf7', background: SURFACE, color: PRIMARY }}
              title={viewMode === 'select' ? 'Switch to input' : 'Switch to dropdown'}
              aria-label="Toggle week input mode"
            >
              {viewMode === 'select' ? '⌨️' : '▼'}
            </button>

            <span className={`p-1 rounded-md`} title="Open week selector" aria-hidden>
              <ChevronDown size={18} color={PRIMARY} className={`${showDropdown ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </div>

        {showDropdown && viewMode === 'select' && (
          <div
            className="absolute z-50 left-0 mt-2 w-[360px] rounded-lg shadow-lg"
            style={{ background: SURFACE, border: `1px solid ${PRIMARY}` }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold" style={{ color: PRIMARY }}>
                  Select week ({min} - {max})
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={16} color={PRIMARY} />
                </button>
              </div>

              <div className="flex gap-2 mb-3 flex-wrap">
                <button onClick={() => { onWeekSelect(min); setShowDropdown(false); }} className="px-2 py-1 text-xs rounded" style={{ background: '#f1f5f9', color: PRIMARY }}>First</button>
                <button onClick={() => { onWeekSelect(Math.max(min, Math.floor((max - min + 1) * 0.25))); setShowDropdown(false); }} className="px-2 py-1 text-xs rounded" style={{ background: '#f1f5f9', color: PRIMARY }}>Q1</button>
                <button onClick={() => { onWeekSelect(Math.floor((min + max) / 2)); setShowDropdown(false); }} className="px-2 py-1 text-xs rounded" style={{ background: '#f1f5f9', color: PRIMARY }}>Mid</button>
                <button onClick={() => { onWeekSelect(Math.max(min, Math.floor((max - min + 1) * 0.75))); setShowDropdown(false); }} className="px-2 py-1 text-xs rounded" style={{ background: '#f1f5f9', color: PRIMARY }}>Q3</button>
                <button onClick={() => { onWeekSelect(max); setShowDropdown(false); }} className="px-2 py-1 text-xs rounded" style={{ background: '#f1f5f9', color: PRIMARY }}>Last</button>
              </div>

              <div className="grid grid-cols-9 gap-2 max-h-64 overflow-y-auto">
                {weeks.map((w) => (
                  <button
                    key={w}
                    onClick={() => { onWeekSelect(w); setShowDropdown(false); }}
                    className={`p-2 text-sm rounded-md font-medium text-center`}
                    style={{
                      background: w === week ? PRIMARY : '#f8fafc',
                      color: w === week ? '#fff' : PRIMARY,
                      border: `1px solid ${w === week ? '#08305a' : '#e6edf7'}`
                    }}
                    title={`Select week ${w}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDropdown && viewMode === 'input' && (
          <div className="absolute z-50 left-0 mt-2 w-full p-3 rounded-lg shadow-lg" style={{ background: SURFACE, border: `1px solid ${PRIMARY}` }}>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const truncated = raw.slice(0, 2);
                  setInputValue(truncated);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitInput();
                    setShowDropdown(false);
                  } else if (e.key === 'Escape') {
                    setInputValue(week.toString());
                    setShowDropdown(false);
                  }
                }}
                onBlur={() => { commitInput(); setShowDropdown(false); }}
                className="w-full px-4 py-3 rounded-md border"
                style={{ border: `1px solid ${PRIMARY}`, textAlign: 'center' }}
                placeholder={`${min}-${max}`}
                aria-label="Enter week number"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={14} color={PRIMARY} />
                  <span>Enter week & press Enter</span>
                </div>
                <div className="text-right">Valid: {min}-{max}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekPicker;