import React, { useState } from 'react';
import type { ModuleConfig } from '../config/types';

interface GenericFilterProps {
    config: ModuleConfig;
    onFilter?: (filters: { [key: string]: string }) => void;
}

const GenericFilter: React.FC<GenericFilterProps> = ({ config, onFilter }) => {
    const [filters, setFilters] = useState<{ [key: string]: string }>({});

    const handleChange = (name: string, value: string) => {
        setFilters({ ...filters, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilter?.(filters);
    };

    const handleReset = () => {
        setFilters({});
        onFilter?.({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 sm:p-6">
                {config.filterConfig.fields.map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <input
                            type={field.type === 'date' ? 'date' : 'text'}
                            value={filters[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Apply Filters
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 transition"
                >
                    Reset
                </button>
            </div>
        </form>
    );
};

export default GenericFilter;
