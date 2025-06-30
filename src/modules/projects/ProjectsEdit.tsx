import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/alert/ToastContext';

const ProjectsEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
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
    const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        // Fetch users for Project Owner dropdown
        fetch(`${API_BASE_URL}/api/projectmanagement/users/`)
            .then(res => res.json())
            .then(data => {
                setUsers(Array.isArray(data) ? data : []);
            })
            .catch(() => setUsers([]));
        // Fetch project data
        if (id) {
            setLoading(true);
            fetch(`${API_BASE_URL}/api/projectmanagement/projects/${id}/`)
                .then(res => res.json())
                .then(data => {
                    setDetailedForm({
                        title: data.project_title || '',
                        owner: data.project_owner || '',
                        startDate: data.start_date ? data.start_date.slice(0, 10) : '',
                        endDate: data.end_date ? data.end_date.slice(0, 10) : '',
                        description: data.description || '',
                        status: data.status || '',
                        priority: data.priority || '',
                        tags: data.document_tagging || '',
                        integrationTag: data.integration_tag || '',
                        clientAccess: !!data.client_access,
                        type: data.internal_external ? (data.internal_external.charAt(0).toUpperCase() + data.internal_external.slice(1).toLowerCase()) : 'Internal',
                    });
                })
                .catch(() => showToast({ type: 'error', title: 'Error', message: 'Failed to fetch project data.' }))
                .finally(() => setLoading(false));
        }
    }, [id, API_BASE_URL]);

    const handleDetailedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setDetailedForm({ ...detailedForm, [e.target.name]: e.target.value });
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

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetailedForm({ ...detailedForm, [e.target.name]: e.target.checked });
    };

    const handleDetailedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const data = {
            project_title: detailedForm.title,
            project_owner: detailedForm.owner,
            start_date: detailedForm.startDate,
            end_date: detailedForm.endDate,
            description: detailedForm.description,
            status: detailedForm.status,
            priority: detailedForm.priority,
            document_tagging: detailedForm.tags,
            integration_tag: detailedForm.integrationTag,
            client_access: detailedForm.clientAccess,
            internal_external: detailedForm.type.toLowerCase(),
        };
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
            let payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== '' && v !== undefined && v !== null));
            const res = await fetch(`${API_BASE_URL}/api/projectmanagement/projects/${id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to update project');
            showToast({ type: 'success', title: 'Success', message: 'Project updated successfully!' });
            navigate(-1);
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="text-[16px] text-black mb-4">Dashboard / Project Management / Edit Project</div>
            <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
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
                            {users.map(user => {
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
                            placeholder="Enter version control note"
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                            value={detailedForm.integrationTag}
                            onChange={handleDetailedChange}
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="block mb-2 font-semibold">Client Access</label>
                        <div className="flex items-center h-full">
                            <input
                                type="checkbox"
                                name="clientAccess"
                                checked={detailedForm.clientAccess}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 accent-orange-500"
                            />
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
                <div className="flex justify-end mt-8">
                    <button
                        type="submit"
                        className="bg-orange-500 text-white px-8 py-2 rounded font-semibold text-[16px] hover:bg-orange-600 flex items-center justify-center min-w-[120px]"
                        disabled={loading}
                    >
                        {loading ? <span className="loader mr-2"></span> : null}
                        {loading ? 'Submitting...' : 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectsEdit;
