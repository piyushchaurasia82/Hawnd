import modulesJson from './modules.json';
import type { Modules } from './types';

//@ts-ignore
const modules: Modules = modulesJson;

// Validate modules (optional)
Object.keys(modules).forEach((key) => {
    const config = modules[key];
    if (!config.table || !config.displayName || !config.apiBaseUrl || !config.endpoints) {
        throw new Error(`Invalid configuration for module ${key}`);
    }
});

export default modules;