import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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

const UserRolesCreate: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
    const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        user_id: '',
        roles: [] as number[],
        assigned_at: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersRes = await api.get('/api/projectmanagement/users/');
                const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || usersRes.data.users || [];
                setUsers(usersData);
                const rolesRes = await api.get('/api/projectmanagement/roles/');
                const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.data || rolesRes.data.roles || [];
                setRoles(rolesData);
            } catch (err) {
                setError('Failed to fetch users or roles');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMultiSelect = (values: (string | number)[]) => {
        setFormData((prev) => ({ ...prev, roles: values as number[] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { roles: selectedRoles, ...otherData } = formData;
            const promises = selectedRoles.map((roleId: number) =>
                api.post(`/api/projectmanagement/user_roles/`, {
                    ...otherData,
                    role_id: roleId
                })
            );
            await Promise.all(promises);
            navigate(`/user_roles`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to create user roles';
            setError(errorMessage);
        }
    };

    return (
        <div className="p-5 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">Create User Roles</h1>
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8 text-sm" aria-label="Tabs">
                    {/* No tabs, but keep structure for consistency */}
                </nav>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="user_id">User</label>
                        <select
                            id="user_id"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleChange}
                            className="w-full rounded bg-gray-100 h-12 p-2 text-sm border border-gray-300"
                            required
                        >
                            <option value="" disabled>Select User</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="roles">Roles</label>
                        <MultiSelectDropdown
                            options={roles.map((role) => ({ value: role.id, label: role.name }))}
                            selectedValues={formData.roles}
                            onChange={handleMultiSelect}
                            label="Roles"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1 text-m" htmlFor="assigned_at">Assigned At</label>
                        <div className="relative w-full">
                            <input
                                id="assigned_at"
                                name="assigned_at"
                                type="date"
                                value={formData.assigned_at}
                                onChange={handleChange}
                                className="w-full rounded bg-gray-100 h-12 p-2 pr-20 text-sm border border-gray-300"
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 border border-gray-300 rounded px-3 py-1 text-xs font-semibold bg-white hover:bg-gray-100"
                                onClick={() => {
                                    const today = new Date();
                                    const yyyy = today.getFullYear();
                                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                                    const dd = String(today.getDate()).padStart(2, '0');
                                    setFormData((prev) => ({ ...prev, assigned_at: `${yyyy}-${mm}-${dd}` }));
                                }}
                            >
                                Today
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-bold rounded px-5 py-2 text-sm shadow hover:bg-orange-600 transition"
                    >
                        Create User Roles
                    </button>
                </div>
                {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
            </form>
        </div>
    );
};

export default UserRolesCreate;
