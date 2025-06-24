import React from 'react';

interface TwoOptionToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}

const TwoOptionToggle: React.FC<TwoOptionToggleProps> = ({ value, onChange, options }) => {
  return (
    <div className="flex rounded-lg border-2 border-orange-500 overflow-hidden w-full max-w-md">
      {options.map((opt, idx) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              `flex-1 py-2 px-6 text-lg font-semibold transition-all duration-150 ` +
              (isSelected
                ? 'bg-white text-black border-2 border-orange-500 rounded-lg m-1 shadow'
                : 'bg-orange-500 text-white')
            }
            style={{
              borderTopLeftRadius: idx === 0 ? '0.5rem' : 0,
              borderBottomLeftRadius: idx === 0 ? '0.5rem' : 0,
              borderTopRightRadius: idx === 1 ? '0.5rem' : 0,
              borderBottomRightRadius: idx === 1 ? '0.5rem' : 0,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default TwoOptionToggle; 