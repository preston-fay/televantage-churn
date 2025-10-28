import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
  className?: string;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatter,
  className = '',
}: SliderProps) {
  const displayValue = formatter ? formatter(value) : value.toString();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-text-secondary text-sm font-medium">{label}</label>
        <span className="text-text-primary font-semibold">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
        style={{
          background: `linear-gradient(to right, #7823DC 0%, #7823DC ${
            ((value - min) / (max - min)) * 100
          }%, #2A2A2A ${((value - min) / (max - min)) * 100}%, #2A2A2A 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>{formatter ? formatter(min) : min}</span>
        <span>{formatter ? formatter(max) : max}</span>
      </div>
    </div>
  );
}
