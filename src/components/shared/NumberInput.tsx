import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function NumberInput({
  label,
  value,
  onChange,
  prefix = '',
  suffix = '',
  min,
  max,
  step = 1,
  className = '',
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      if (min !== undefined && newValue < min) {
        onChange(min);
      } else if (max !== undefined && newValue > max) {
        onChange(max);
      } else {
        onChange(newValue);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-text-secondary text-sm font-medium">{label}</label>
      <div className="flex items-center space-x-2">
        {prefix && <span className="text-text-primary font-medium">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="input flex-1"
        />
        {suffix && <span className="text-text-primary font-medium">{suffix}</span>}
      </div>
    </div>
  );
}
