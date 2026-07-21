import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200/80 hover:border-blue-950/60 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 font-sans focus:outline-none flex items-center justify-between shadow-2xs transition-all cursor-pointer h-[38px]"
      >
        <span className="truncate mr-1 font-medium font-sans">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[2] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-950" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 min-w-[150px] w-full mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-100/90 rounded-2xl shadow-xl py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-sans">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer font-sans ${
                  isSelected
                    ? "bg-blue-50/80 text-blue-950 font-medium"
                    : "text-slate-700 hover:bg-slate-50 font-normal"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-950 shrink-0 ml-2 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
