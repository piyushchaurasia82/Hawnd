import React from 'react';
import { useParams } from 'react-router-dom';
import GenericShow from '../../components/GenericShow';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface UsersShowProps {
    moduleName: string;
}

const UsersShow: React.FC<UsersShowProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;

    if (!config) return <div className="text-lg font-medium text-red-600">Module not found</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{config.displayName} Details</h1>
            <GenericShow config={config} id={id!} />
        </div>
    );
};

export default UsersShow;
