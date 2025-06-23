import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface TimeLogsCreateProps {
    moduleName: string;
}

const TimeLogsCreate: React.FC<TimeLogsCreateProps> = ({ moduleName }) => {
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();

    if (!config) return <div className="text-red-600 text-lg font-semibold p-4">Module not found</div>;

    const handleSubmit = async (formData: { [key: string]: any }) => {
        try {
            await api.post(
                `${config.apiBaseUrl}${config.endpoints.create.url}/`,
                formData
            );
            navigate(`/${moduleName}`);
        } catch (error) {
            console.error('Error creating:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Create {config.displayName}</h1>
            <GenericForm config={config} onSubmit={handleSubmit} />
        </div>
    );
};

export default TimeLogsCreate;
