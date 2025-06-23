import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from "../services/api";
import type { ApiListResponse, ModuleConfig, Field } from '../config/types';
import Input from './form/input/InputField';

interface GenericFormProps {
  config: ModuleConfig;
  id?: string;
  onSubmit: (formData: { [key: string]: any }) => void;
  isEdit?: boolean;
}

// Recursively extract key-value pairs into a flat map
const extractAllKeys = (obj: any, result: Record<string, any> = {}) => {
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      extractAllKeys(value, result);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// Return only the fields that match your form field names
export const getEditFormData = (apiResponse: any, formFields: string[]) => {
  const flat = extractAllKeys(apiResponse);
  const result: any = { id: apiResponse.id };

  formFields.forEach((field) => {
    result[field] = flat[field] ?? null;
  });

  return result;
};

// MultiSelectDropdown component
const MultiSelectDropdown = ({ options, selectedValues, onChange, label, disabled }: {
  options: { value: string | number; label: string }[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  label?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string | number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="border rounded p-2 w-full text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : `Select ${label || ''}`}
        <span className="float-right">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label key={option.value} className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                disabled={disabled}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const GenericForm: React.FC<GenericFormProps> = ({
  config,
  id,
  onSubmit,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [options, setOptions] = useState<{ [key: string]: { value: string | number; label: string }[] }>({});

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(
        `${config.apiBaseUrl}${config.endpoints.read.url.replace(":id", id)}/`
      );
      setFormData(getEditFormData(data, config.formConfig.fields));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [id, config.apiBaseUrl, config.endpoints.read.url]);

  const fetchSelectOptions = useCallback(async (field: Field) => {
    if (!config) return;
    try {
      let url = '';
      let labelField = '';
      const isUserRoles = config && config.table === 'user_roles';
      
      if (field.name === 'role') {
        url = `/api/projectmanagement/roles/`;
        labelField = isUserRoles ? 'name' : 'description';
      } else if (field.name === 'permission') {
        url = `/api/projectmanagement/permissions/`;
        labelField = 'code_name';
      } else if (field.name === 'role_id') {
        url = `/api/projectmanagement/roles/`;
        labelField = isUserRoles ? 'name' : 'description';
      } else if (field.name === 'roles') {
        url = `/api/projectmanagement/roles/`;
        labelField = isUserRoles ? 'name' : 'description';
      } else if (field.name === 'user_id') {
        url = `/api/projectmanagement/users/`;
        labelField = 'username';
      } else {
        return; // Skip if not a known select field
      }
      
      const response = await api.get<ApiListResponse<any>>(url);
      
      // Handle different response structures
      let data: any[] = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && Array.isArray((response.data as any).users)) {
        data = (response.data as any).users;
      } else if (response.data && Array.isArray((response.data as any).roles)) {
        data = (response.data as any).roles;
      }
      
      const fetchedOptions = data.map((item: any) => ({
        value: item.id,
        label: field.name === 'user_id' 
          ? `${item.first_name || ''} ${item.last_name || ''} (${item.username || ''})`.trim()
          : item[labelField] || item.name || item.description || item.code_name || `ID: ${item.id}`,
      }));
      setOptions((prev) => ({ ...prev, [field.name]: fetchedOptions }));
    } catch (error) {
      console.error(`Error fetching options for ${field.name}:`, error);
    }
  }, [config]);

  useEffect(() => {
    if (isEdit && id) {
      fetchData();
    }
    // Fetch options for select and multiselect fields
    config.formConfig.fields.forEach((fieldName) => {
      const field = config.fields.find((f: Field) => f.name === fieldName);
      if ((field?.type === 'select' || field?.type === 'multiselect') && !field.options) {
        fetchSelectOptions(field);
      }
    });
  }, [isEdit, id, fetchData, config.formConfig.fields, config.fields, fetchSelectOptions]);

  const handleChange = (name: string, value: string | boolean | (string | number)[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    const validation = config.formConfig.validation[name] || {};
    const field = config.fields.find((f: Field) => f.name === name);
    const newErrors = { ...errors };

    if (validation.required) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          newErrors[name] = validation.required;
        } else {
          delete newErrors[name];
        }
      } else if (value === '' || value === null || value === undefined) {
        newErrors[name] = validation.required;
      } else {
        delete newErrors[name];
      }
    } else if (validation.maxLength && typeof value === 'string' && value.length > (field?.maxLength || 0)) {
      newErrors[name] = validation.maxLength;
    } else {
      delete newErrors[name];
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: { [key: string]: string } = {};

    for (const fieldName of config.formConfig.fields) {
      const field = config.fields.find((f: Field) => f.name === fieldName);
      const validation = config.formConfig.validation[fieldName] || {};
      const value = formData[fieldName];

      if (validation.required && (value === '' || value === null || value === undefined)) {
        validationErrors[fieldName] = validation.required;
      }

      if (validation.maxLength && typeof value === 'string' && value?.length > (field?.maxLength || 0)) {
        validationErrors[fieldName] = validation.maxLength;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-lg mx-auto px-2 sm:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 sm:p-6">
        {config.formConfig.fields.map((fieldName) => {
          const field = config.fields.find((f: Field) => f.name === fieldName);
          if (!field?.visibleInForm) return null;

          const errorMsg = errors[field.name];

          if (field.type === 'select') {
            const selectOptions = field.options || options[field.name] || [];
            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={field.readOnly}
                  className={`border rounded p-2 w-full ${
                    errorMsg ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="" disabled>
                    Select {field.label}
                  </option>
                  {selectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errorMsg && (
                  <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
                )}
              </div>
            );
          }

          if (field.type === 'multiselect') {
            const selectOptions = field.options || options[field.name] || [];
            const selectedValues = Array.isArray(formData[field.name]) ? formData[field.name] : [];
            return (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                <MultiSelectDropdown
                  options={selectOptions}
                  selectedValues={selectedValues}
                  onChange={(vals) => handleChange(field.name, vals)}
                  label={field.label}
                  disabled={field.readOnly}
                />
                {errorMsg && (
                  <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
                )}
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium  mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={field.readOnly}
                  className={`border rounded p-2 w-full ${
                    errorMsg ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={1}
                />
                {errorMsg && (
                  <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
                )}
              </div>
            );
          }

          if (field.type === 'boolean') {
            return (
              <div key={field.name} className="flex items-center">
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  disabled={field.readOnly}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    errorMsg ? 'border-red-500' : ''
                  }`}
                />
                <label
                  htmlFor={field.name}
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                {errorMsg && (
                  <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
                )}
              </div>
            );
          }

          const inputType =
            field.type === 'datetime' ? 'datetime-local' :
            field.type === 'date' ? 'date' :
            field.type === 'number' ? 'number' :
            'text';

          return (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
                {field.required && <span className="text-red-600">*</span>}
              </label>
              <Input
                type={inputType}
                name={field.name}
                placeholder={field.label}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={field.readOnly}
                error={!!errorMsg}
                hint={errorMsg}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={Object.keys(errors).length > 0}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default GenericForm;