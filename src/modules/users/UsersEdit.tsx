import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { tokenManager, postAuditLog } from '../../services/api';
import modules from '../../config/loadModules';
import InputField from '../../components/form/input/InputField';
import SelectField from '../../components/form/input/SelectField';
import TextArea from '../../components/form/input/TextArea';
import Checkbox from '../../components/form/input/Checkbox';
import type { ModuleConfig, Field } from '../../config/types';
import { usePasswordChange } from '../../pages/AccountSettings';
import { useToast } from '../../components/ui/alert/ToastContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

const MultiSelectDropdown = ({ options, selectedValues, onChange, label, disabled, onAddNew }: {
  options: { value: string | number; label: string }[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  label?: string;
  disabled?: boolean;
  onAddNew?: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
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
          <button
            type="button"
            className="w-full text-left px-2 py-1 text-orange-600 hover:bg-orange-50 font-semibold border-t border-gray-200"
            onClick={onAddNew}
          >
            + Create New Role
          </button>
        </div>
      )}
    </div>
  );
};

const UsersEdit: React.FC<{ moduleName?: string }> = ({ moduleName = 'users' }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const { lastChangedPassword } = usePasswordChange();
    const { showToast } = useToast();
    const { user: currentUser } = useCurrentUser();

    const [formData, setFormData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [rolesOptions, setRolesOptions] = React.useState<{ value: string; label: string }[]>([]);
    const [selectedRoles, setSelectedRoles] = React.useState<(string | number)[]>([]);

    useEffect(() => {
        if (!config || !id) return;
        setLoading(true);
        api.get(`${config.apiBaseUrl}${config.endpoints.read.url.replace(':id', id)}/`)
            .then(res => {
                // Robust extraction: handle both { data: user } and { ...user fields }
                let user = res.data;
                if (user && typeof user === 'object' && 'data' in user && user.data) {
                  user = user.data;
                }
                if (!user || typeof user !== 'object') {
                  setError('User data not found.');
                  setLoading(false);
                  return;
                }
                // Always ensure is_active is present and boolean for the toggle
                if (typeof user.is_active === 'undefined' || user.is_active === null) {
                    user.is_active = true;
                } else if (typeof user.is_active === 'string') {
                    user.is_active = user.is_active === "true" || user.is_active === "True";
                } else if (typeof user.is_active !== 'boolean') {
                    user.is_active = user.is_active === true || user.is_active === 'TRUE' || user.is_active === 1;
                }
                // If this is the logged-in user, check for last changed password in context
                const userData = tokenManager.getUserData();
                if (userData && userData.username && user.username === userData.username && lastChangedPassword) {
                  user.hashed_password = lastChangedPassword;
                }
                setFormData(user);
                setLoading(false);
            })
            .catch((err) => {
                setError('Failed to load user data. ' + (err?.message || ''));
                setLoading(false);
                // Log error for debugging
                // eslint-disable-next-line no-console
                console.error('Error fetching user by id:', err);
            });
    }, [config, id, lastChangedPassword]);

    useEffect(() => {
        api.get('/api/projectmanagement/roles/').then(res => {
            setRolesOptions((res.data.data || res.data.roles || res.data).map((r: any) => ({ value: String(r.id), label: r.name || r.description })));
        });
    }, []);

    useEffect(() => {
        if (!id) return;
        api.get('/api/projectmanagement/user_roles/').then(res => {
            const userRoles = (res.data.data || res.data.user_roles || res.data).filter((ur: any) => String(ur.user_id) === String(id)).map((ur: any) => String(ur.role_id));
            setSelectedRoles(userRoles);
        });
    }, [id]);

    if (!config) return <div className="text-lg font-medium text-red-600">Module not found</div>;
    if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;

    const fields = config.formConfig.fields.map(
        fname => config.fields.find(f => f.name === fname)
    ).filter(Boolean) as Field[];

    // Filter out the hashed_password and is_active fields from the form
    const visibleFields = fields.filter(field => field.name !== 'hashed_password' && field.name !== 'is_active');

    // Make username field disabled in edit form
    const renderField = (field: Field) => {
        if (field.name === 'username') {
            return (
                <div key={field.name} className="mb-4">
                    <label className="block mb-2 font-medium text-gray-900 text-sm">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username || ''}
                        disabled
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            );
        }
        if (field.type === 'boolean') {
            let value = formData[field.name];
            if (typeof value === 'undefined' || value === null) {
                value = true; // Default to true if undefined/null
            } else if (typeof value === 'string') {
                value = value === "true" || value === "True";
            } else if (typeof value !== 'boolean') {
                value = value === true || value === 'TRUE' || value === 1;
            }
            return (
                <div key={field.name} className="flex items-center mt-6">
                    <Checkbox
                        id={field.name}
                        label={field.label}
                        checked={!!value}
                        onChange={v => handleChange(field.name, v)}
                    />
                </div>
            );
        }
        if (field.type === 'textarea') {
            return (
                <div key={field.name}>
                    <label className="block font-semibold mb-1">{field.label}</label>
                    <TextArea
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.name]}
                        onChange={v => handleChange(field.name, v)}
                    />
                </div>
            );
        }
        if (field.type === 'select' && field.options) {
            return (
                <div key={field.name}>
                    <label className="block font-semibold mb-1">{field.label}</label>
                    <SelectField
                        value={formData[field.name]}
                        onChange={e => handleChange(field.name, e.target.value)}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </SelectField>
                </div>
            );
        }
        // Default: text, number, etc.
        return (
            <div key={field.name}>
                <label className="block font-semibold mb-1">{field.label}</label>
                <InputField
                    type={field.type === 'number' ? 'number' : 'text'}
                    name={field.name}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.name]}
                    onChange={e => handleChange(field.name, e.target.value)}
                />
            </div>
        );
    };

    const handleChange = (name: string, value: any) => {
        // Special handling for is_active to always set boolean
        if (name === 'is_active') {
            setFormData(prev => ({ ...prev, [name]: !!value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            // Always include is_active as string in the payload
            const payload = { ...formData };
            payload.is_active = formData.is_active ? "true" : "false";

            // 1. Fetch current user_roles for this user
            const userRolesRes = await api.get('/api/projectmanagement/user_roles/');
            const allUserRoles = userRolesRes.data.data || userRolesRes.data.user_roles || userRolesRes.data;
            const currentUserRoles = allUserRoles.filter((ur: any) => String(ur.user_id) === String(id));
            const currentRoleIds = currentUserRoles.map((ur: any) => String(ur.role_id));

            // 2. Add new roles
            const rolesToAdd = selectedRoles.filter(roleId => !currentRoleIds.includes(String(roleId)));
            await Promise.all(rolesToAdd.map(roleId =>
                api.post('/api/projectmanagement/user_roles/', {
                    user_id: id,
                    role_id: roleId
                })
            ));

            // 3. Remove deselected roles
            const rolesToRemove = currentUserRoles.filter((ur: any) => !selectedRoles.includes(String(ur.role_id)));
            await Promise.all(rolesToRemove.map((ur: any) =>
                api.delete(`/api/projectmanagement/user_roles/${ur.id}/`)
            ));

            // 4. Update user details
            await api.put(
                `${config.apiBaseUrl}${config.endpoints.update.url.replace(':id', id!)}/`,
                payload
            );
            // Audit log: User Edited
            const performerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : (JSON.parse(localStorage.getItem('user_data') || '{}').username || 'Unknown');
            await postAuditLog({
                action: 'User Edited',
                affected_user: `${formData.first_name} ${formData.last_name}`.trim(),
                performer: performerName,
                description: `User details for ${formData.first_name} ${formData.last_name} were updated by ${performerName}.`
            });
            showToast({
                type: 'success',
                title: 'User Updated',
                message: 'The user has been updated successfully.',
                duration: 5000
            });
            // Remove force logout logic for current user
            // const userData = tokenManager.getUserData();
            // if (userData && String(userData.id) === String(id)) {
            //     tokenManager.clearTokens();
            //     window.location.href = '/auth';
            //     return;
            // }
            navigate(`/${moduleName}`);
        } catch (err: any) {
            setError('Error updating user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Breadcrumb
    const Breadcrumb = () => (
        <nav className="text-xs text-gray-500 mb-2 flex gap-1">
            <button type="button" onClick={() => navigate('/')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Home</button>
            <span>/</span>
            <button type="button" onClick={() => navigate('/users')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Users</button>
            <span>/</span>
            <span className="font-semibold text-black">Edit User</span>
        </nav>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Breadcrumb />
            <h1 className="text-2xl font-bold mb-6">Edit User</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-4">User Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {visibleFields.map(field => renderField(field))}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-4">Roles</h2>
                    <div className="max-w-xs relative">
                        <MultiSelectDropdown
                            options={rolesOptions}
                            selectedValues={selectedRoles}
                            onChange={setSelectedRoles}
                            label="Roles"
                            onAddNew={() => navigate('/roles/create')}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4 mb-8">
                    <span className="block font-semibold mb-1">Status</span>
                    <div className="flex gap-0 overflow-hidden border border-orange-500 w-fit">
                        <button
                            type="button"
                            className={`py-1 px-6 font-semibold text-[16px] transition-all ${formData.is_active !== false ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                            onClick={() => handleChange('is_active', true)}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            className={`py-1 px-6 font-semibold text-[16px] transition-all ${formData.is_active === false ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                            onClick={() => handleChange('is_active', false)}
                        >
                            Inactive
                        </button>
                    </div>
                </div>
                {error && <div className="text-red-600 mb-4">{error}</div>}
                <div className="flex gap-4 justify-end">
                    <button
                        type="submit"
                        className="bg-orange-600 text-white rounded px-6 py-2 font-semibold hover:bg-gray-800 disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        className="bg-gray-200 text-black rounded px-6 py-2 font-semibold hover:bg-gray-300"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UsersEdit;
