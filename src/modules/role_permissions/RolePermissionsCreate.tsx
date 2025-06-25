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
        <div className="p-5 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">Create Role Permission</h1>
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8 text-sm" aria-label="Tabs">
                    {/* No tabs, but keep structure for consistency */}
                </nav>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="block font-semibold mb-1 text-m" htmlFor="role">Role</label>
                    <SingleSelectDropdown
                        options={roles.map((role) => ({ value: role.id, label: role.name }))}
                        selectedValue={formData.role}
                        onChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                        label="Role"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-semibold mb-1 text-m" htmlFor="permission">Permissions</label>
                    <MultiSelectDropdown
                        options={permissions.map((perm) => ({ value: perm.id, label: perm.code_name }))}
                        selectedValues={formData.permission}
                        onChange={handleMultiSelect}
                        label="Permissions"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-bold rounded px-5 py-2 text-sm shadow hover:bg-orange-600 transition"
                    >
                        Create Role Permission
                    </button>
                </div>
                {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
            </form>
        </div>
    );
};

export default RolePermissionsCreate;
