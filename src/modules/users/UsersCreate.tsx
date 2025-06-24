import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';
import Switch from '../../components/form/switch/Switch';

// SingleSelectDropdown for boolean (is_active)
const SingleSelectDropdown = ({ options, selectedValue, onChange, label, disabled }: {
  options: { value: string | number | boolean; label: string }[];
  selectedValue: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  label?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
              key={String(option.value)}
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

interface UsersCreateProps {
    moduleName: string;
}

const UsersCreate: React.FC<UsersCreateProps> = ({ moduleName }) => {
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        hashed_password: '',
        first_name: '',
        last_name: '',
        is_active: true
    });
    const [error, setError] = useState<string | null>(null);

    if (!config) return <div className="text-red-600 text-lg font-semibold p-4">Module not found</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(
                `${config.apiBaseUrl}${config.endpoints.create.url}/`,
                formData
            );
            navigate(`/${moduleName}`);
        } catch (error) {
            setError('Error creating user. Please try again.');
            console.error('Error creating:', error);
        }
    };

    return (
        <div className="p-5 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">Create User</h1>
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8 text-sm" aria-label="Tabs">
                    {/* No tabs, but keep structure for consistency */}
                </nav>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="hashed_password">Hashed Password</label>
                        <input
                            id="hashed_password"
                            name="hashed_password"
                            value={formData.hashed_password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                            required
                            type="password"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="first_name">First Name</label>
                        <input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="last_name">Last Name</label>
                        <input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="is_active">Is Active</label>
                        <Switch
                            
                            label={formData.is_active ? 'Active' : 'Inactive'}
                            defaultChecked={formData.is_active}
                            onChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-bold rounded px-5 py-2 text-sm shadow hover:bg-orange-600 transition"
                    >
                        Create User
                    </button>
                </div>
                {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
            </form>
        </div>
    );
};

export default UsersCreate;
