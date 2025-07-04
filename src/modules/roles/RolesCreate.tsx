import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import modules from "../../config/loadModules";
import type { ModuleConfig } from "../../config/types";

interface RolesCreateProps {
  moduleName: string;
}

const RolesCreate: React.FC<RolesCreateProps> = ({ moduleName }) => {
  const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await api.get("/api/projectmanagement/permissions/");
        setPermissions(res.data.data || res.data.permissions || res.data);
      } catch (e) {
        setPermissions([]);
      }
    }
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissions.length > 0 && selectedPermissions.length === permissions.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedPermissions, permissions]);

  if (!config)
    return (
      <div className="text-red-600 text-lg font-semibold p-4">
        Module not found
      </div>
    );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map((p) => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Create the role
      const roleRes = await api.post(
        `${config.apiBaseUrl}${config.endpoints.create.url}/`,
        {
          ...formData,
        }
      );
      const roleId = roleRes.data?.id || roleRes.data?.data?.id || roleRes.data?.role?.id;
      // 2. Assign permissions if any
      if (roleId && selectedPermissions.length > 0) {
        await api.post('/api/projectmanagement/role-permissions/', {
          role_id: roleId,
          permission: selectedPermissions,
        });
      }
      navigate(`/${moduleName}`);
    } catch (error) {
      setError("Error creating role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-[16px] text-black mb-4 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/roles')}>Roles</span>
        <span className="mx-1">/</span>
        <span className="font-semibold">Create Role</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Create New Role</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block font-semibold mb-1 text-base">Role Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter  role name"
              className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 border border-gray-200"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-base">Role Description</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter  role description"
              className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 border border-gray-200"
              required
            />
          </div>
        </div>
        <div className="bg-[#F9F6F2] rounded-lg p-6 mb-8 max-w-3xl">
          <h2 className="text-lg font-bold mb-4">Permission Assignment</h2>
          <div className="flex items-center mb-4">
            <span className="font-semibold text-base mr-4">Select All</span>
            <button
              type="button"
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${selectAll ? 'bg-orange-500' : 'bg-gray-200'}`}
              onClick={handleSelectAll}
              aria-pressed={selectAll}
            >
              <span className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${selectAll ? 'translate-x-5' : ''}`}></span>
            </button>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {permissions.map((perm) => (
              <label key={perm.id} className="flex items-start gap-3 cursor-pointer text-base">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.id)}
                  onChange={() => handlePermissionChange(perm.id)}
                  className="w-5 h-5 mt-1 accent-orange-500 border-gray-300 rounded"
                />
                <span>
                  <span className="font-semibold text-base">{perm.name}</span>
                  {perm.description && <span className="text-sm font-normal text-gray-700"> - {perm.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="bg-[#F9F6F2] text-black font-bold rounded px-8 py-3 text-base border border-gray-200 hover:bg-gray-200 transition"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-orange-500 text-white font-bold rounded px-8 py-3 text-base shadow hover:bg-orange-600 transition"
            disabled={loading}
          >
            Save Role
          </button>
        </div>
        {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
      </form>
    </div>
  );
};

export default RolesCreate;
