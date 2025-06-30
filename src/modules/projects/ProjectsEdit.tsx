import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/alert/ToastContext';
import api from '../../services/api';

interface ProjectsEditProps {
    moduleName: string;
}

const ProjectsEdit: React.FC<ProjectsEditProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
    const [form, setForm] = useState({
        title: '',
        owner: '',
        startDate: '',
        endDate: null,
        description: '',
        status: '',
        priority: '',
        tags: '',
        integrationTag: '',
        clientAccess: false,
        type: 'Internal',
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Fetch users for Project Owner dropdown (role-based)
    useEffect(() => {
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
                usersData = usersData.data || usersData.users || usersData;
                userRolesData = userRolesData.data || userRolesData.user_roles || userRolesData;
                // If roles API failed or returned an error, fallback to showing all users
                if (!rolesData || rolesData.error) {
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
                setUsers([]);
                setFilteredUsers([]);
            }
        };
        fetchUsersWithRoles();
    }, [API_BASE_URL]);

    // Fetch project details
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`${API_BASE_URL}/api/projectmanagement/projects/${id}/`)
            .then(res => res.json())
            .then(res => {
                const data = res.data; // Use the nested data object
                setForm({
                    title: data.project_title || '',
                    owner: data.project_owner || '', // Use the name string
                    startDate: data.start_date ? data.start_date.slice(0, 10) : '',
                    endDate: null, // Always set endDate to null (empty field)
                    description: data.description || '',
                    status: data.status || '',
                    priority: data.priority || '',
                    tags: data.document_tagging || '',
                    integrationTag: data.integration_tag || '',
                    clientAccess: !!data.client_access,
                    type: data.internal_external
                        ? data.internal_external.charAt(0).toUpperCase() + data.internal_external.slice(1).toLowerCase()
                        : 'Internal',
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    // Helper to capitalize first letter
    function capitalize(str: string) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let fieldValue: any = value;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            fieldValue = e.target.checked;
        }
        setForm(prev => ({
            ...prev,
            [name]: fieldValue
        }));
        // Remove error for this field
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleTypeChange = (type: string) => {
        setForm(prev => ({ ...prev, type }));
        if (fieldErrors.internal_external) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.internal_external;
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        // Validation
        const errors: { [key: string]: string } = {};
        if (!form.title) errors.project_title = 'Project Title is required';
        if (!form.owner) errors.project_owner = 'Project Owner is required';
        if (!form.type) errors.internal_external = 'Project Type is required';
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
            return;
        }
        setLoading(true);
        try {
            await api.put(`${API_BASE_URL}/api/projectmanagement/projects/${id}/`, {
                project_title: form.title,
                project_owner: form.owner,
                start_date: form.startDate,
                end_date: form.endDate,
                description: form.description,
                status: form.status,
                priority: form.priority,
                document_tagging: form.tags,
                integration_tag: form.integrationTag,
                client_access: form.clientAccess,
                internal_external: form.type.toLowerCase(),
            });
            // Show toast after reload
            localStorage.setItem('app_last_toast', JSON.stringify({
                type: 'success',
                title: 'Project Updated Successfully',
                message: 'The project details have been updated.',
                duration: 5000,
                shownAt: Date.now()
            }));
            navigate(-1); // Go back to projects list
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="text-[16px] text-black mb-4">Dashboard / Project Management / Edit Page</div>
            <h1 className="text-2xl font-bold mb-6">Edit Page</h1>
            <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block mb-2 font-semibold">Project Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="title"
                            placeholder="Enter project title"
                            className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0 ${fieldErrors.project_title ? 'border border-red-500' : ''}`}
                            value={form.title}
                            onChange={handleChange}
                        />
                        {fieldErrors.project_title && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_title}</div>}
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Project Owner <span className="text-red-500">*</span></label>
                        <select
                            name="owner"
                            className={`w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0 ${fieldErrors.project_owner ? 'border border-red-500' : ''}`}
                            value={form.owner}
                            onChange={handleChange}
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
                        <label className="block mb-2 font-semibold">Enter Project Date</label>
                        <input
                            type="date"
                            name="startDate"
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                            value={form.startDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block mb-2 font-semibold">Status</label>
                        <select
                            name="status"
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                            value={form.status}
                            onChange={handleChange}
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
                            value={form.priority}
                            onChange={handleChange}
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
                            value={form.tags}
                            onChange={handleChange}
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
                            value={form.integrationTag}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="block mb-2 font-semibold">Client Access</label>
                        <div className="flex gap-0 overflow-hidden border border-orange-500 w-fit">
                            <button
                                type="button"
                                className={`py-1 px-6 font-semibold text-[16px] transition-all ${form.clientAccess ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                onClick={() => setForm(prev => ({ ...prev, clientAccess: true }))}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                className={`py-1 px-6 font-semibold text-[16px] transition-all ${!form.clientAccess ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                onClick={() => setForm(prev => ({ ...prev, clientAccess: false }))}
                            >
                                No
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="block mb-2 font-semibold">Project Type <span className="text-red-500">*</span></label>
                        <div className="flex gap-0 overflow-hidden border border-orange-500 w-fit">
                            <button
                                type="button"
                                className={`py-1 px-6 font-semibold text-[16px] transition-all ${form.type === 'Internal' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                onClick={() => handleTypeChange('Internal')}
                            >
                                Internal
                            </button>
                            <button
                                type="button"
                                className={`py-1 px-6 font-semibold text-[16px] transition-all ${form.type === 'External' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                                onClick={() => handleTypeChange('External')}
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
                        value={form.description}
                        onChange={handleChange}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">Upload Files</div>
                </div>
                <div className="flex justify-end mt-8 gap-4">
                    <button
                        type="button"
                        className="bg-[#F1F1F1] text-black px-8 py-2 rounded font-semibold text-[16px] hover:bg-gray-200"
                        onClick={() => navigate(-1)}
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
        </div>
    );
};

export default ProjectsEdit;
