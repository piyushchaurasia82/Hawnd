import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import modules from '../../config/loadModules';
import InputField from '../../components/form/input/InputField';
import SelectField from '../../components/form/input/SelectField';
import TextArea from '../../components/form/input/TextArea';
import Checkbox from '../../components/form/input/Checkbox';
import type { ModuleConfig, Field } from '../../config/types';

const UsersEdit: React.FC<{ moduleName: string }> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();

    const [formData, setFormData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!config || !id) return;
        setLoading(true);
        api.get(`${config.apiBaseUrl}${config.endpoints.read.url.replace(':id', id)}/`)
            .then(res => {
                const user = res.data;
                // Always ensure is_active is present and boolean
                if (typeof user.is_active === 'undefined' || user.is_active === null) {
                    user.is_active = false;
                } else if (typeof user.is_active !== 'boolean') {
                    user.is_active = user.is_active === true || user.is_active === 'TRUE' || user.is_active === 1;
                }
                setFormData(user);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load user data.');
                setLoading(false);
            });
    }, [config, id]);

    if (!config) return <div className="text-lg font-medium text-red-600">Module not found</div>;
    if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;

    const fields = config.formConfig.fields.map(
        fname => config.fields.find(f => f.name === fname)
    ).filter(Boolean) as Field[];

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
            // Always include is_active as boolean in the payload, even if false
            const payload = { ...formData };
            if (typeof payload.is_active === 'undefined' || payload.is_active === null) payload.is_active = false;
            payload.is_active = !!payload.is_active;
            await api.put(
                `${config.apiBaseUrl}${config.endpoints.update.url.replace(':id', id!)}/`,
                payload
            );
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
                        {fields.map(field => {
                            let value = formData[field.name];
                            if (field.type === 'boolean') {
                                value = typeof value === 'boolean' ? value : value === 'TRUE' || value === 1;
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
                                            value={value}
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
                                            value={value}
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
                                        value={value}
                                        onChange={e => handleChange(field.name, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                {error && <div className="text-red-600 mb-4">{error}</div>}
                <div className="flex gap-4">
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
