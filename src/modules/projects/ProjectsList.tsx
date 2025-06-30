import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericList from '../../components/GenericList';
import GenericFilter from '../../components/GenericFilter';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';
import { useToast } from '../../components/ui/alert/ToastContext';
import { ConfirmationModal } from '../../components/ui/modal';

interface ProjectsListProps {
    moduleName: string;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const config: ModuleConfig = modules[moduleName as keyof typeof modules];

    // Fetch projects from API
    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get(`${config.apiBaseUrl}${config.endpoints.list.url}/`);
            const projectsData = response.data.data || response.data;
            setProjects(projectsData);
            setFilteredProjects(projectsData);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
            setFilteredProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Apply filters whenever search or filter values change
    useEffect(() => {
        let filtered = [...projects];

        // Search filter - search by project title
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(project => 
                project.project_title?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(project => 
                project.status === statusFilter
            );
        }

        // Priority filter
        if (priorityFilter) {
            filtered = filtered.filter(project => 
                project.priority === priorityFilter
            );
        }

        // Project type filter
        if (typeFilter) {
            filtered = filtered.filter(project => 
                project.internal_external?.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        setFilteredProjects(filtered);
    }, [search, statusFilter, priorityFilter, typeFilter, projects]);

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
        // Set the project to delete and open the confirmation modal
        setProjectToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setDeleteModalOpen(false); // Close modal immediately
        setProjectToDelete(null);
        setTimeout(async () => {
            try {
                await api.delete(
                    `${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', projectToDelete.toString())}/`
                );
                // Save toast to localStorage and reload (do not call showToast)
                localStorage.setItem('app_last_toast', JSON.stringify({
                  type: 'success',
                  title: 'Project Deleted Successfully',
                  message: 'The project has been permanently removed from the system.',
                  duration: 5000,
                  shownAt: Date.now()
                }));
                window.location.reload();
            } catch (error: any) {
                showToast({
                    type: 'error',
                    title: 'Delete Failed',
                    message: error.response?.data?.message || 'Failed to delete the project. Please try again.',
                    duration: 5000
                });
            }
        }, 100);
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
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search projects"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
                    </span>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)} 
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Status</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <select 
                        value={priorityFilter} 
                        onChange={e => setPriorityFilter(e.target.value)} 
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select 
                        value={typeFilter} 
                        onChange={e => setTypeFilter(e.target.value)} 
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[150px]"
                    >
                        <option value="">Project Type</option>
                        <option value="Internal">Internal</option>
                        <option value="External">External</option>
                    </select>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <p className="mt-2 text-gray-600">Loading projects...</p>
                </div>
            )}

            {/* Results count */}
            {!loading && (
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredProjects.length} of {projects.length} projects
                </div>
            )}

            {/* Projects table */}
            {!loading && (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                        <thead className="bg-gray-100 text-gray-700 text-left">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Project Title</th>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Owner</th>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Status</th>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Priority</th>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Project Type</th>
                                <th className="px-4 py-3 whitespace-nowrap font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="border border-[#EAEAEA]">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="px-4 py-4">
                                            <button 
                                                onClick={() => handleShow(row.id)} 
                                                className="text-left hover:text-orange-500 hover:underline transition-colors cursor-pointer"
                                            >
                                                {row.project_title}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">{row.project_owner}</td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                                                    ${row.status === 'In Progress' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''}
                                                    ${row.status === 'Completed' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                                                    ${row.status === 'Todo' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}
                                                `}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full mr-1
                                                        ${row.status === 'In Progress' ? 'bg-orange-500' : ''}
                                                        ${row.status === 'Completed' ? 'bg-green-500' : ''}
                                                        ${row.status === 'Todo' ? 'bg-blue-500' : ''}
                                                    `}
                                                ></span>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                                                    ${row.priority === 'High' ? 'border-red-500 text-red-600 bg-red-50' : ''}
                                                    ${row.priority === 'Medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                                                    ${row.priority === 'Low' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                                                `}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full mr-1
                                                        ${row.priority === 'High' ? 'bg-red-500' : ''}
                                                        ${row.priority === 'Medium' ? 'bg-yellow-400' : ''}
                                                        ${row.priority === 'Low' ? 'bg-green-500' : ''}
                                                    `}
                                                ></span>
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                                                    ${row.internal_external?.toLowerCase() === 'internal' ? 'border-purple-500 text-purple-600 bg-purple-50' : ''}
                                                    ${row.internal_external?.toLowerCase() === 'external' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : ''}
                                                `}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full mr-1
                                                        ${row.internal_external?.toLowerCase() === 'internal' ? 'bg-purple-500' : ''}
                                                        ${row.internal_external?.toLowerCase() === 'external' ? 'bg-indigo-500' : ''}
                                                    `}
                                                ></span>
                                                {row.internal_external ? 
                                                    row.internal_external.charAt(0).toUpperCase() + row.internal_external.slice(1).toLowerCase() 
                                                    : 'N/A'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex space-x-3">
                                                <button onClick={() => handleEdit(row.id)} className="text-black" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        {loading ? 'Loading projects...' : 'No projects found matching your criteria.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setProjectToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Project"
                message="Are you sure you want to delete this project? This action cannot be undone and will permanently remove the project and all associated data including tasks, comments, and attachments."
                confirmText="Delete Project"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default ProjectsList;
