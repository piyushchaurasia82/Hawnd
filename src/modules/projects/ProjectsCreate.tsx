import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectsCreateProps {
    moduleName: string;
}

const ProjectsCreate: React.FC<ProjectsCreateProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'quick' | 'detailed'>('quick');
    const [quickForm, setQuickForm] = useState({
        title: '',
        owner: '',
        type: 'Internal',
    });
    const [detailedForm, setDetailedForm] = useState({
        title: '',
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

    const handleQuickChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setQuickForm({ ...quickForm, [e.target.name]: e.target.value });
    };
    const handleDetailedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setDetailedForm({ ...detailedForm, [e.target.name]: e.target.value });
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
                <form className="space-y-8">
                    <div className=' md:w-6/12'>
                        <label className="block mb-2 font-semibold">Project Title</label>
                        <input
                            type="text"
                            name="title"
                            placeholder="e.g. Website Redesign"
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0"
                            value={quickForm.title}
                            onChange={handleQuickChange}
                        />
                    </div>
                    <div className=' md:w-6/12'>
                        <label className="block mb-2 font-semibold">Project Owner</label>
                        <input
                            type="text"
                            name="owner"
                            placeholder="Select an owner"
                            className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0"
                            value={quickForm.owner}
                            onChange={handleQuickChange}
                        />
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
                                className={`py-1 px-6 rounded font-semibold text-[16px]  ${quickForm.type === "External" ?  " text-black bg-[#FCFAF7]" : "text-white"}`}onClick={() => setQuickForm({ ...quickForm, type: 'External' })}
                            >
                                External
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="bg-orange-500 text-white px-8 py-2 rounded font-semibold text-[16px] hover:bg-orange-600"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            )}
            {/* Detailed Create Tab */}
            {tab === 'detailed' && (
                <form className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 font-semibold">Project Title</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter project title"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black placeholder:text-black border-0"
                                value={detailedForm.title}
                                onChange={handleDetailedChange}
                            />
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
                        <div>
                            <label className="block mb-2 font-semibold">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                className="w-full bg-[#F1F1F1] rounded px-4 py-3 text-black border-0"
                                value={detailedForm.endDate}
                                onChange={handleDetailedChange}
                            />
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
                                    onChange={e => setDetailedForm({ ...detailedForm, clientAccess: e.target.checked })}
                                    className="w-5 h-5 accent-orange-500"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block mb-2 font-semibold">&nbsp;</label>
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
                        </div>
                    </div>
                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            className="bg-orange-500 text-white px-8 py-2 rounded font-semibold text-[16px] hover:bg-orange-600"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProjectsCreate;
