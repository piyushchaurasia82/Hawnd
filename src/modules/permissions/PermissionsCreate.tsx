import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface PermissionsCreateProps {
    moduleName: string;
}

const PermissionsCreate: React.FC<PermissionsCreateProps> = ({ moduleName }) => {
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ code_name: '', description: '' });
    const [error, setError] = useState<string | null>(null);

    if (!config) return <div className="text-red-600 text-lg font-semibold p-4">Module not found</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            setError('Error creating permission. Please try again.');
            console.error('Error creating:', error);
        }
    };

    return (
        <div className="p-5 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">Create Permission</h1>
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8 text-sm" aria-label="Tabs">
                    {/* No tabs, but keep structure for consistency */}
                </nav>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="block font-semibold mb-1 text-m" htmlFor="code_name">Name</label>
                    <input
                        id="code_name"
                        name="code_name"
                        value={formData.code_name}
                        onChange={handleChange}
                        placeholder="Enter permission name"
                        className="w-full rounded bg-gray-100 p-2 h-12 text-sm placeholder-gray-400"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-semibold mb-1 text-m" htmlFor="description">Description</label>
                    <input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter permission description"
                        className="w-full rounded bg-gray-100 h-12 p-2 text-sm placeholder-gray-400"
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-bold rounded px-5 py-2 text-sm shadow hover:bg-orange-600 transition"
                    >
                        Create Permission
                    </button>
                </div>
                {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
            </form>
        </div>
    );
};

export default PermissionsCreate;
