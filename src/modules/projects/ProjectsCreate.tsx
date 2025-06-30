import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/alert/ToastContext';
import api from '../../services/api';

interface ProjectsCreateProps {
    moduleName: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    roles?: string[];
}

const ProjectsCreate: React.FC<ProjectsCreateProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [tab, setTab] = useState<'quick' | 'detailed'>('quick');
    const [quickForm, setQuickForm] = useState({
        title: '',
        owner: '',
        type: 'Internal',
    });
    const [detailedForm, setDetailedForm] = useState({
        title: '',
        owner: '',
        startDate: '',
        endDate: '',
        description: '',
        status: '',
        priority: '',
        tags: '',
        integrationTag: '',
        clientAccess: false,
        type: 'Internal',
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    // Get API base URL from env
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Allowed roles for project owners
    const ALLOWED_ROLES = ['Admin', 'Manager', 'Project Lead'];

    useEffect(() => {
        // Fetch users, user_roles, and roles for Project Owner dropdown
        const fetchUsersWithRoles = async () => {
            try {
                const [usersRes, userRolesRes, rolesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/projectmanagement/users/`),
                    fetch(`${API_BASE_URL}/api/projectmanagement/user_roles/`),
                    api.get('/api/projectmanagement/roles/')
                ]);

                let usersData = await usersRes.json();
                let userRolesData = await userRolesRes.json();
                let rolesData = rolesRes.data.data || rolesRes.data.roles || rolesRes.data;

                // Debug logs
                console.log('Users API:', usersData);
                console.log('UserRoles API:', userRolesData);
                console.log('Roles API:', rolesData);

                // Handle common API response shapes
                usersData = usersData.data || usersData.users || usersData;
                userRolesData = userRolesData.data || userRolesData.user_roles || userRolesData;

                // If roles API failed or returned an error, fallback to showing all users
                if (!rolesData || rolesData.error) {
                    console.warn('Roles API failed or unauthorized. Showing all users in project owner dropdown.');
                    setUsers(usersData);
                    setFilteredUsers(usersData);
                    return;
                }

                // Allowed role names
                const ALLOWED_ROLE_NAMES = ['Admin', 'Manager', 'Project Lead'];

                // Create a map of role_id to role name
                const roleIdToName = new Map();
                rolesData.forEach((role: any) => {
                    if (role.id && (role.name || role.description)) {
                        roleIdToName.set(role.id, (role.name || role.description).trim());
                    }
                });

                // Create a map of user_id to array of role names
                const userIdToRoleNames = new Map();
                userRolesData.forEach((ur: any) => {
                    const roleName = roleIdToName.get(ur.role_id);
                    if (roleName) {
                        if (!userIdToRoleNames.has(ur.user_id)) {
                            userIdToRoleNames.set(ur.user_id, []);
                        }
                        userIdToRoleNames.get(ur.user_id).push(roleName);
                    }
                });

                // Filter users: include if any of their roles matches allowed names
                const filtered = usersData.filter((user: any) => {
                    const userRoles = userIdToRoleNames.get(user.id) || [];
                    return userRoles.some((roleName: string) =>
                        ALLOWED_ROLE_NAMES.some(allowed => roleName.toLowerCase() === allowed.toLowerCase())
                    );
                });
                setUsers(usersData);
                setFilteredUsers(filtered);

            } catch (error) {
                console.error('Error fetching users with roles:', error);
                setUsers([]);
                setFilteredUsers([]);
            }
        };

        fetchUsersWithRoles();
    }, [API_BASE_URL]);

    const handleQuickChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setQuickForm({ ...quickForm, [e.target.name]: e.target.value });
        // Remove error for this field
        if (fieldErrors[e.target.name === 'title' ? 'project_title' : e.target.name === 'owner' ? 'project_owner' : e.target.name === 'type' ? 'internal_external' : e.target.name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                if (e.target.name === 'title') delete newErrors.project_title;
                else if (e.target.name === 'owner') delete newErrors.project_owner;
                else if (e.target.name === 'type') delete newErrors.internal_external;
                else delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };
    const handleDetailedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setDetailedForm({ ...detailedForm, [e.target.name]: e.target.value });
        // Remove error for this field
        if (fieldErrors[e.target.name === 'title' ? 'project_title' : e.target.name === 'owner' ? 'project_owner' : e.target.name === 'type' ? 'internal_external' : e.target.name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                if (e.target.name === 'title') delete newErrors.project_title;
                else if (e.target.name === 'owner') delete newErrors.project_owner;
                else if (e.target.name === 'type') delete newErrors.internal_external;
                else delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    // Helper to map quick form to API
    const mapQuickToApi = () => ({
        project_title: quickForm.title,
        project_owner: quickForm.owner,
        internal_external: quickForm.type.toLowerCase(),
    });

    // Helper to map detailed form to API
    const mapDetailedToApi = () => ({
        project_title: detailedForm.title,
        project_owner: detailedForm.owner || '', // fallback if not present
        start_date: detailedForm.startDate,
        description: detailedForm.description,
        status: detailedForm.status,
        priority: detailedForm.priority,
        document_tagging: detailedForm.tags,
        integration_tag: detailedForm.integrationTag,
        client_access: detailedForm.clientAccess,
        internal_external: detailedForm.type.toLowerCase(),
    });

    // Quick Create submit handler
    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const data = mapQuickToApi();
        const errors: { [key: string]: string } = {};
        if (!data.project_title) errors.project_title = 'Project Title is required';
        if (!data.project_owner) errors.project_owner = 'Project Owner is required';
        if (!data.internal_external) errors.internal_external = 'Project Type is required';
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/projectmanagement/projects/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create project');
            showToast({ type: 'success', title: 'Success', message: 'Project created successfully!' });
            navigate(-1);
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
        } finally {
            setLoading(false);
        }
    };

    // Detailed Create submit handler
    const handleDetailedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const data = mapDetailedToApi();
        const errors: { [key: string]: string } = {};
        if (!data.project_title) errors.project_title = 'Project Title is required';
        if (!data.project_owner) errors.project_owner = 'Project Owner is required';
        if (!data.internal_external) errors.internal_external = 'Project Type is required';
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/projectmanagement/projects/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create project');
            showToast({ type: 'success', title: 'Success', message: 'Project created successfully!' });
            navigate(-1);
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/projects');
    };

    return (
        <div className="p-4">
            <div className="text-[16px] text-black mb-4">Dashboard / Project Management / Create Project</div>
            <h1 className="text-2xl font-bold mb-6">Create Project</h1>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${tab === 'quick' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
                    onClick={() => setTab('quick')}
                >
                    Quick Create
                </button>
                <button
                    className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${tab === 'detailed' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
                    onClick={() => setTab('detailed')}
                >
                    Detailed Create
                </button>
            </div>
            {/* Quick Create Tab */}
            {tab === 'quick' && (
                <form className="space-y-8" onSubmit={handleQuickSubmit}>
                    <div className=' md:w-6/12'>
                        <label className="block mb-2 font-semibold">
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            placeholder="e.g. Website Redesign"
                            className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0 ${fieldErrors.project_title ? 'border border-red-500' : ''}`}
                            value={quickForm.title}
                            onChange={handleQuickChange}
                        />
                        {fieldErrors.project_title && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_title}</div>}
                    </div>
                    <div className=' md:w-6/12'>
                        <label className="block mb-2 font-semibold">
                            Project Owner <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="owner"
                            className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0 ${fieldErrors.project_owner ? 'border border-red-500' : ''}`}
                            value={quickForm.owner}
                            onChange={handleQuickChange}
                        >
                            <option value="">Select an owner</option>
                            {filteredUsers.map(user => {
                                const fullName = `${user.first_name} ${user.last_name}`.trim();
                                return (
                                    <option key={user.id} value={fullName}>{fullName}</option>
                                );
                            })}
                        </select>
                        {fieldErrors.project_owner && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_owner}</div>}
                    </div>
                    <div className="flex justify-between items-center mt-8">
                        <div className="flex gap-2 bg-orange-500 rounded py-1 px-1">
                            <button
                                type="button"
                                className={`py-1 px-6 rounded font-semibold text-[16px]  ${quickForm.type === "Internal" ?  " text-black bg-[#FCFAF7]" : "text-white"}`}
                                onClick={() => setQuickForm({ ...quickForm, type: 'Internal' })}
                            >
                                Internal
                            </button>
                            <button
                                type="button"
                                className={`py-1 px-6 rounded font-semibold text-[16px]  ${quickForm.type === "External" ?  " text-black bg-[#FCFAF7]" : "text-white"}`}
                                onClick={() => setQuickForm({ ...quickForm, type: 'External' })}
                            >
                                External
                            </button>
                        </div>
                        {fieldErrors.internal_external && <div className="text-red-500 text-sm mt-1">{fieldErrors.internal_external}</div>}
                        <div className="flex justify-end mt-8 gap-4">
                            <button
                                type="button"
                                className="bg-[#F1F1F1] text-black px-8 py-2 rounded font-semibold text-[16px] hover:bg-gray-200"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-orange-500 text-white px-8 py-2 rounded font-semibold text-[16px] hover:bg-orange-600 flex items-center justify-center min-w-[120px]"
                                disabled={loading}
                            >
                                {loading ? <span className="loader mr-2"></span> : null}
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
            {/* Detailed Create Tab */}
            {tab === 'detailed' && (
                <form className="space-y-8" onSubmit={handleDetailedSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 font-semibold">
                                Project Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter project title"
                                className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0 ${fieldErrors.project_title ? 'border border-red-500' : ''}`}
                                value={detailedForm.title}
                                onChange={handleDetailedChange}
                            />
                            {fieldErrors.project_title && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_title}</div>}
                        </div>
                        <div>
                            <label className="block mb-2 font-semibold">
                                Project Owner <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="owner"
                                className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0 ${fieldErrors.project_owner ? 'border border-red-500' : ''}`}
                                value={detailedForm.owner}
                                onChange={handleDetailedChange}
                            >
                                <option value="">Select an owner</option>
                                {filteredUsers.map(user => {
                                    const fullName = `${user.first_name} ${user.last_name}`.trim();
                                    return (
                                        <option key={user.id} value={fullName}>{fullName}</option>
                                    );
                                })}
                            </select>
                            {fieldErrors.project_owner && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_owner}</div>}
                        </div>
                        <div>
                            <label className="block mb-2 font-semibold">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.startDate}
                                onChange={handleDetailedChange}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 font-semibold">Status</label>
                            <select
                                name="status"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.status}
                                onChange={handleDetailedChange}
                            >
                                <option value="">Select status</option>
                                <option value="Todo">Todo</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 font-semibold">Priority</label>
                            <select
                                name="priority"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.priority}
                                onChange={handleDetailedChange}
                            >
                                <option value="">Select priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 font-semibold">Document Tagging</label>
                            <input
                                type="text"
                                name="tags"
                                placeholder="Enter tags"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.tags}
                                onChange={handleDetailedChange}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 font-semibold">Integration Tag</label>
                            <input
                                type="text"
                                name="integrationTag"
                                placeholder="Select status"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.integrationTag}
                                onChange={handleDetailedChange}
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block mb-2 font-semibold">Client Access</label>
                            <div className="flex gap-0 overflow-hidden border border-orange-500 w-fit">
                                <button
                                    type="button"
                                    className={`py-1 px-6 font-semibold text-[16px] transition-all ${detailedForm.clientAccess ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                    onClick={() => setDetailedForm(prev => ({ ...prev, clientAccess: true }))}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    className={`py-1 px-6 font-semibold text-[16px] transition-all ${!detailedForm.clientAccess ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                    onClick={() => setDetailedForm(prev => ({ ...prev, clientAccess: false }))}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block mb-2 font-semibold">
                                Project Type <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 bg-orange-500 rounded py-1 px-1">
                                <button
                                    type="button"
                                    className={`w-full py-1 px-6 rounded font-semibold text-[16px]  ${detailedForm.type === "Internal" ?  " text-black bg-[#FCFAF7]" : "text-white"}`}
                                    onClick={() => setDetailedForm({ ...detailedForm, type: 'Internal' })}
                                >
                                    Internal
                                </button>
                                <button
                                    type="button"
                                    className={`w-full py-1 px-6 rounded font-semibold text-[16px]  ${detailedForm.type === "External" ?  " text-black bg-[#FCFAF7]" : "text-white"}`}
                                    onClick={() => setDetailedForm({ ...detailedForm, type: 'External' })}
                                >
                                    External
                                </button>
                            </div>
                            {fieldErrors.internal_external && <div className="text-red-500 text-sm mt-1">{fieldErrors.internal_external}</div>}
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Description</label>
                        <textarea
                            name="description"
                            placeholder=""
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0 min-h-[100px]"
                            value={detailedForm.description}
                            onChange={handleDetailedChange}
                        />
                        <div className="text-right text-sm text-gray-500 mt-1">Upload Files</div>
                    </div>
                    <div className="flex justify-end mt-8 gap-4">
                        <button
                            type="button"
                            className="bg-[#F1F1F1] text-black px-8 py-2 rounded font-semibold text-[16px] hover:bg-gray-200"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-orange-500 text-white px-8 py-2 rounded font-semibold text-[16px] hover:bg-orange-600 flex items-center justify-center min-w-[120px]"
                            disabled={loading}
                        >
                            {loading ? <span className="loader mr-2"></span> : null}
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProjectsCreate;

<style>
{`
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`}
</style>
