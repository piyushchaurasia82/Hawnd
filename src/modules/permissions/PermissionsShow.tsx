import React from 'react';
import { useParams } from 'react-router-dom';
import GenericShow from '../../components/GenericShow';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface PermissionsShowProps {
    moduleName: string;
}

const PermissionsShow: React.FC<PermissionsShowProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;

    if (!config) return <div className="text-lg font-medium text-red-600">Module not found</div>;

    return (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 text-sm sm:text-base">
            <h1 className="text-2xl font-bold mb-4">{config.displayName} Details</h1>
            <GenericShow config={config} id={id!} />
        </div>
    );
};

export default PermissionsShow;
