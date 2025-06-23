import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface ProjectMembersEditProps {
    moduleName: string;
}

const ProjectMembersEdit: React.FC<ProjectMembersEditProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();

    if (!config) return (
        <div className="text-lg font-medium text-red-600">Module not found</div>
    );

    const handleSubmit = async (formData: { [key: string]: any }) => {
        try {
            await api.put(
                `${config.apiBaseUrl}${config.endpoints.update.url.replace(':id', id!)}/`,
                formData
            );
            navigate(`/${moduleName}`);
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edit {config.displayName}</h1>
            <GenericForm config={config} id={id} onSubmit={handleSubmit} isEdit />
        </div>
    );
};

export default ProjectMembersEdit;
