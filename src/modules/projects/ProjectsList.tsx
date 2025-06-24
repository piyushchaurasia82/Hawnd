import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericList from '../../components/GenericList';
import GenericFilter from '../../components/GenericFilter';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface ProjectsListProps {
    moduleName: string;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [search, setSearch] = useState('');
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
        navigate(`/${moduleName}/${id}/tasks`);
    };

    return (
        <div className="p-4">
            {/* Header with title and New Project button */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div className="text-[16px] text-black mb-4">Dashboard / Project Management</div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                </div>
                <button
                    className="bg-[#F1F1F1] border-0 rounded px-4 py-2 text-sm font-semibold hover:bg-gray-200"
                    onClick={() => navigate(`/${moduleName}/create`)}
                >
                    + New Project
                </button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:justify-between mb-6 gap-6">
                <input
                    type="text"
                    placeholder="Search projects"
                    className="border-0 rounded px-3 py-2 w-full bg-[#F1F1F1] focus:outline-0 text-black placeholder:text-black"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2">
                    <select className="border-0 rounded px-3 py-2 text-[14px] bg-[#F1F1F1] text-black">
                        <option>My Projects</option>
                        {/* Add more options as needed */}
                    </select>
                    <select className="border-0 rounded px-3 py-2 text-[14px] bg-[#F1F1F1] text-black">
                        <option>Active</option>
                        {/* Add more options as needed */}
                    </select>
                    <select className="border-0 rounded px-3 py-2 text-[14px] bg-[#F1F1F1] text-black">
                        <option>Archived</option>
                        {/* Add more options as needed */}
                    </select>
                </div>
            </div>

            {/* Existing filter component (optional, can be removed if not needed) */}
            {/* <div className="mb-6">
                <GenericFilter config={config} onFilter={handleFilter} />
            </div> */}

            <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                    <GenericList
                        config={config}
                        filters={filters}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onShow={handleShow}
                    />
                </table>
            </div>
        </div>
    );
};

export default ProjectsList;
