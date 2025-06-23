import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericList from '../../components/GenericList';
import GenericFilter from '../../components/GenericFilter';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface TimeLogsListProps {
    moduleName: string;
}

const TimeLogsList: React.FC<TimeLogsListProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const config: ModuleConfig = modules[moduleName as keyof typeof modules];

    if (!config) {
        return <h1 className="text-xl font-semibold text-red-600">Module not found</h1>;
    }

    const handleFilter = (newFilters: { [key: string]: string }) => {
        setFilters(newFilters);
    };

    const handleEdit = (id: number) => {
        navigate(`/${moduleName}/edit/${id}`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(`Are you sure you want to delete this ${config.displayName}?`)) {
            try {
                await api.delete(
                    `${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', id.toString())}/`
                );
                window.location.reload();
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const handleShow = (id: number) => {
        navigate(`/${moduleName}/show/${id}`);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{config.displayName} List</h1>
            <div className="mb-6">
                <GenericFilter config={config} onFilter={handleFilter} />
            </div>
            <GenericList
                config={config}
                filters={filters}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShow={handleShow}
            />
        </div>
    );
};

export default TimeLogsList;
