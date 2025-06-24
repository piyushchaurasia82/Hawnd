import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ModuleConfig } from '../config/types';

interface GenericShowProps {
    config: ModuleConfig;
    id: string;
}

const GenericShow: React.FC<GenericShowProps> = ({ config, id }) => {
    const [data, setData] = useState<{ [key: string]: any } | null>(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const response = await api.get(
                `${config.apiBaseUrl}${config.endpoints.read.url.replace(':id', id)}/`
            );
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    if (!data) return <div className="text-gray-500">Loading...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields
                .filter((field) => field.visibleInList || field.visibleInForm)
                .map((field) => (
                    <div key={field.name}>
                        <p className="text-sm font-semibold text-gray-700">{field.label}:</p>
                        <p className="text-sm text-gray-900">{data[field.name] || 'N/A'}</p>
                    </div>
                ))}
        </div>
    );
};

export default GenericShow;
