import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GenericForm from "../../components/GenericForm";
import modules from "../../config/loadModules";
import type { ModuleConfig } from "../../config/types";

interface RolesCreateProps {
  moduleName: string;
}

const RolesCreate: React.FC<RolesCreateProps> = ({ moduleName }) => {
  const config: ModuleConfig | undefined = moduleName
    ? modules[moduleName]
    : undefined;
  const navigate = useNavigate();

  if (!config)
    return (
      <div className="text-red-800 text-lg font-semibold p-4">
        Module not found
      </div>
    );

  const handleSubmit = async (formData: { [key: string]: any }) => {
    try {
      await api.post(
        `${config.apiBaseUrl}${config.endpoints.create.url}/`,
        formData
      );
      navigate(`/${moduleName}`);
    } catch (error) {
      console.error("Error creating:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Create {config.displayName}</h1>
      <form className="space-y-4 sm:space-y-6 w-full max-w-lg mx-auto px-2 sm:px-0">
        <GenericForm config={config} onSubmit={handleSubmit} />
      </form>
    </div>
  );
};

export default RolesCreate;
