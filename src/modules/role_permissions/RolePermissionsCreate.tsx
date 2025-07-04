import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

// MultiSelectDropdown component (copied from GenericForm)
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
        className="w-full bg-gray-100 rounded h-12 p-2 text-sm border border-gray-300 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selectedLabels.length === 0 ? 'text-gray-400' : ''}>
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : `Select ${label || ''}`}
        </span>
        <span className="ml-2 text-gray-400">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label key={option.value} className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 text-sm">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-2"
                disabled={disabled}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// SingleSelectDropdown component (like MultiSelectDropdown but for single selection)
const SingleSelectDropdown = ({ options, selectedValue, onChange, label, disabled }: {
  options: { value: string | number; label: string }[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
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

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full bg-gray-100 rounded h-12 p-2 text-sm border border-gray-300 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={!selectedLabel ? 'text-gray-400' : ''}>
          {selectedLabel || `Select ${label || ''}`}
        </span>
        <span className="ml-2 text-gray-400">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-2 py-2 cursor-pointer hover:bg-gray-100 text-sm flex items-center ${selectedValue === option.value ? 'font-semibold text-orange-600' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RolePermissionsCreateProps {
    moduleName: string;
}

const RolePermissionsCreate: React.FC<RolePermissionsCreateProps> = ({ moduleName }) => {
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [roles, setRoles] = useState<{ id: number; name: string; description?: string }[]>([]);
    const [permissions, setPermissions] = useState<{ id: number; code_name: string; description?: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<{ role: string | number; permission: (string | number)[] }>({ role: '', permission: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const rolesResponse = await api.get(`/api/projectmanagement/roles/`);
                const rolesData = Array.isArray(rolesResponse.data)
                  ? rolesResponse.data
                  : rolesResponse.data.data || rolesResponse.data.roles || [];
                setRoles(rolesData);

                const permissionsResponse = await api.get(`/api/projectmanagement/permissions/`);
                const permissionsData = Array.isArray(permissionsResponse.data)
                  ? permissionsResponse.data
                  : permissionsResponse.data.data || permissionsResponse.data.permissions || [];
                setPermissions(permissionsData);
            } catch (err) {
                setError('Failed to fetch roles or permissions');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (!config) return <div className="text-red-600 text-lg font-semibold p-4">Module not found</div>;
    if (loading) return <div className="text-gray-600 text-lg p-4">Loading...</div>;
    if (error) return <div className="text-red-600 text-lg font-semibold p-4">{error}</div>;

    const handleMultiSelect = (values: (string | number)[]) => {
        setFormData((prev) => ({ ...prev, permission: values }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { permission, ...otherData } = formData;
            const promises = permission.map((permId) =>
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    permission: permId
                })
            );
            await Promise.all(promises);
            navigate(`/${moduleName}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to create role permissions';
            setError(errorMessage);
            console.error('Error creating:', error);
        }
    };

    return (
        <div className="p-8 max-w-7xl">
            {/* Breadcrumb */}
            <div className="text-[16px] text-black mb-4 flex items-center gap-1">
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
                <span className="mx-1">/</span>
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/role_permissions')}>Role Permissions</span>
                <span className="mx-1">/</span>
                <span className="text-gray-700">Create Role Permission</span>
            </div>
            <h1 className="text-2xl font-bold mb-8">Create Role Permission</h1>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-row gap-4 items-start mb-0">
                    <div style={{ width: 420 }}>
                        <SingleSelectDropdown
                            options={roles.map(r => ({ value: r.id, label: r.name }))}
                            selectedValue={formData.role}
                            onChange={val => setFormData(prev => ({ ...prev, role: val }))}
                            label="Role"
                        />
                    </div>
                    <div style={{ width: 420 }}>
                        <MultiSelectDropdown
                            options={permissions.map(p => ({
                                value: p.id,
                                label: p.code_name + (p.description ? ` - ${p.description}` : '')
                            }))}
                            selectedValues={formData.permission}
                            onChange={handleMultiSelect}
                            label="Permissions"
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-2 mt-8">
                    <button
                        type="button"
                        className="bg-gray-100 text-black px-6 py-2 rounded mr-2 border border-gray-200 hover:bg-gray-200"
                        onClick={() => navigate(`/${moduleName}`)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 font-semibold"
                        disabled={!formData.role || formData.permission.length === 0}
                    >
                        Create Role Permission
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RolePermissionsCreate;
