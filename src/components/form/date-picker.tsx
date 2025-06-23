import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import type { Options } from 'flatpickr/dist/types/options';

type DatePickerProps = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: (dates: Date[], currentDateString: string) => void;
  defaultDate?: string | Date | Date[];
  label?: string;
  placeholder?: string;
  options?: Partial<Options>;
};

const DatePicker = ({
  id,
  mode = "single",
  onChange,
  defaultDate,
  label,
  placeholder,
  options = {},
}: DatePickerProps) => {
  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode,
      defaultDate,
      ...options,
      onChange: (selectedDates, dateStr) => {
        if (onChange) {
          onChange(selectedDates, dateStr);
        }
      },
    });

    return () => {
      if (Array.isArray(flatPickr)) {
        flatPickr.forEach(instance => instance.destroy());
      } else {
        flatPickr.destroy();
      }
    };
  }, [id, mode, defaultDate, onChange, options]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-12 pr-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
        <CalenderIcon className="absolute left-4 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
};

export default DatePicker;
