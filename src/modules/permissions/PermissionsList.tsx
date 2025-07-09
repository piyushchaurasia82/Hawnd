import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GenericList from "../../components/GenericList";
import GenericFilter from "../../components/GenericFilter";
import modules from "../../config/loadModules";
import type { ModuleConfig } from "../../config/types";
import { useCurrentUser } from '../../context/CurrentUserContext';
import { postAuditLog } from '../../services/api';

interface PermissionsListProps {
  moduleName: string;
}

const PermissionsList: React.FC<PermissionsListProps> = ({ moduleName }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const config: ModuleConfig = modules[moduleName as keyof typeof modules];
  const { user: currentUser } = useCurrentUser();

  if (!config) {
    return (
      <h1 className="text-xl font-semibold text-red-600">Module not found</h1>
    );
  }

  const handleFilter = (newFilters: { [key: string]: string }) => {
    setFilters(newFilters);
  };

  const handleEdit = (id: number) => {
    navigate(`/${moduleName}/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${config.displayName}?`
      )
    ) {
      try {
        await api.delete(
          `${config.apiBaseUrl}${config.endpoints.delete.url.replace(":id", id.toString())}/`
        );
        // Audit log: Permission Deleted
        const performerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : (JSON.parse(localStorage.getItem('user_data') || '{}').username || 'Unknown');
        await postAuditLog({
          action: 'Permission Deleted',
          affected_user: id,
          performer: performerName,
          description: `Permission with ID ${id} was deleted by ${performerName}.`
        });
        window.location.reload();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleShow = (id: number) => {
    navigate(`/${moduleName}/show/${id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{config.displayName} List</h1>
      <div className="mb-6">
        <GenericFilter config={config} onFilter={handleFilter} />
      </div>
      <GenericList
        config={config}
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShow={handleShow}
      />
    </div>
  );
};

export default PermissionsList;
