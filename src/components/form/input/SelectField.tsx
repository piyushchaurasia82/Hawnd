import React from "react";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  field?: any;
  className?: string;
  children?: React.ReactNode;
}

const SelectField: React.FC<SelectFieldProps> = ({ field = {}, className = "", children, ...props }) => {
  return (
    <select
      {...field}
      className={`block w-full max-w-md mx-auto rounded-lg border border-gray-300 bg-white p-3 md:p-4 text-gray-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm md:text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export default SelectField; 