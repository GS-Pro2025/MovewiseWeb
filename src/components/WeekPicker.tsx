import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";

interface WeekPickerProps {
  week: number;
  onWeekSelect: (week: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const PRIMARY = "#0B2863";
const SURFACE = "#ffffff";

const WeekPicker: React.FC<WeekPickerProps> = ({
  week, onWeekSelect, min = 1, max = 52, className,
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode]         = useState<"select" | "input">("select");
  const dropdownRef                     = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue]     = useState<string>(week.toString());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setInputValue(week.toString()); }, [week]);

  const weeks = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setShowDropdown(true); }
    else if (e.key === "Escape") setShowDropdown(false);
    else if (e.key === "Enter") setShowDropdown(!showDropdown);
  };

  const commitInput = () => {
    if (inputValue === "") { setInputValue(week.toString()); return; }
    const w = parseInt(inputValue, 10);
    if (!isNaN(w) && w >= min && w <= max) { onWeekSelect(w); setInputValue(w.toString()); }
    else setInputValue(week.toString());
  };

  const prevWeek = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); if (week > min) onWeekSelect(week - 1); };
  const nextWeek = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); if (week < max) onWeekSelect(week + 1); };

  const navBtnStyle = (disabled: boolean) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 24, borderRadius: 4,
    border: `1px solid ${PRIMARY}`,
    background: disabled ? "#f1f5f9" : SURFACE,
    color: PRIMARY,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div className={className}>
      <div ref={dropdownRef} className="relative w-full">
        <label className="block text-xs font-bold text-[#0B2863] mb-1">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} /> {t("weekPicker.label")}
          </div>
        </label>

        <div
          className="rounded-lg p-2 flex items-center justify-between gap-2 cursor-pointer w-full bg-white"
          onClick={() => setShowDropdown(!showDropdown)}
          onKeyDown={handleKeyDown}
          tabIndex={0} aria-haspopup="listbox" aria-expanded={showDropdown} role="button" translate="no"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button onClick={prevWeek} onMouseDown={(e) => e.stopPropagation()}
                aria-label={t("weekPicker.previousWeek")} disabled={week <= min}
                className="flex-shrink-0" style={navBtnStyle(week <= min)}>
                <ChevronLeft size={12} />
              </button>
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-bold truncate" style={{ color: PRIMARY }}>
                  {t("weekPicker.label")} <span translate="no">{week}</span>
                </div>
              </div>
              <button onClick={nextWeek} onMouseDown={(e) => e.stopPropagation()}
                aria-label={t("weekPicker.nextWeek")} disabled={week >= max}
                className="flex-shrink-0" style={navBtnStyle(week >= max)}>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === "select" ? "input" : "select"); }}
              className="text-xs px-1.5 py-0.5 rounded border flex-shrink-0"
              style={{ borderColor: "#e6edf7", background: SURFACE, color: PRIMARY }}
              title={viewMode === "select" ? t("weekPicker.switchToInput") : t("weekPicker.switchToDropdown")}
              aria-label="Toggle week input mode"
            >
              {viewMode === "select" ? "⌨️" : "▼"}
            </button>
            <span className="p-0.5 rounded flex-shrink-0" aria-hidden>
              <ChevronDown size={14} color={PRIMARY} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </span>
          </div>
        </div>

        {/* Select dropdown */}
        {showDropdown && viewMode === "select" && (
          <div className="absolute z-50 left-0 right-0 mt-2 rounded-lg shadow-lg max-w-full"
            style={{ background: SURFACE, border: `1px solid ${PRIMARY}` }} translate="no">
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold" style={{ color: PRIMARY }}>
                  {t("weekPicker.selectWeek", { min, max })}
                </div>
                <button onClick={() => setShowDropdown(false)} className="p-1 rounded hover:bg-gray-100" aria-label={t("weekPicker.close")}>
                  <X size={14} color={PRIMARY} />
                </button>
              </div>

              <div className="flex gap-1.5 mb-2 flex-wrap">
                {[
                  { label: t("weekPicker.first"), value: min },
                  { label: "Q1",                  value: Math.max(min, Math.floor((max - min + 1) * 0.25) + min) },
                  { label: t("weekPicker.mid"),   value: Math.floor((min + max) / 2) },
                  { label: "Q3",                  value: Math.max(min, Math.floor((max - min + 1) * 0.75) + min) },
                  { label: t("weekPicker.last"),  value: max },
                ].map(({ label, value }) => (
                  <button key={label} onClick={() => { onWeekSelect(value); setShowDropdown(false); }}
                    className="px-2 py-1 text-xs rounded font-medium"
                    style={{ background: "#f1f5f9", color: PRIMARY }}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {weeks.map((w) => (
                  <button key={w} onClick={() => { onWeekSelect(w); setShowDropdown(false); }}
                    className="p-1.5 text-xs rounded font-semibold text-center transition-all duration-200 hover:shadow-sm"
                    style={{
                      background: w === week ? PRIMARY : "#f8fafc",
                      color: w === week ? "#fff" : PRIMARY,
                      border: `1px solid ${w === week ? "#08305a" : "#e6edf7"}`,
                    }}
                    title={t("weekPicker.selectWeekTitle", { week: w })}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input mode */}
        {showDropdown && viewMode === "input" && (
          <div className="absolute z-50 left-0 right-0 mt-2 p-3 rounded-lg shadow-lg"
            style={{ background: SURFACE, border: `1px solid ${PRIMARY}` }} translate="no">
            <div className="flex flex-col gap-2">
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={inputValue}
                onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setInputValue(raw.slice(0, 2)); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { commitInput(); setShowDropdown(false); }
                  else if (e.key === "Escape") { setInputValue(week.toString()); setShowDropdown(false); }
                }}
                onBlur={() => { commitInput(); setShowDropdown(false); }}
                className="w-full px-3 py-2 rounded-md border text-sm font-bold"
                style={{ borderColor: PRIMARY, textAlign: "center", color: PRIMARY }}
                placeholder={`${min}-${max}`}
                aria-label={t("weekPicker.label")}
                autoFocus
              />
              <div className="flex justify-between text-xs" style={{ color: PRIMARY }}>
                <div className="flex items-center gap-1">
                  <Calendar size={12} color={PRIMARY} />
                  <span>{t("weekPicker.pressEnter")}</span>
                </div>
                <div className="text-right">{t("weekPicker.valid", { min, max })}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${PRIMARY}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #08305a; }
      `}</style>
    </div>
  );
};

export default WeekPicker;