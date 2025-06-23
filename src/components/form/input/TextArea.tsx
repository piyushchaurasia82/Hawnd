import React from "react";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
  id?: string;
  name?: string;
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  id,
  name,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className} `;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed opacity40 dark:bg-gray-100 dark:text-gray-500 dark:border-gray-300`;
  } else if (error) {
    textareaClasses += ` bg-white  border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-300 dark:bg-white dark:text-black dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-white text-black dark:text-black text-black border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-300 dark:bg-white dark:text-black dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        rows={rows}
        className={textareaClasses + ' w-full px-3 py-2 sm:px-4 sm:py-2.5'}
        disabled={disabled}
      />
      {hint && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
