export interface Field {
  name: string;
  label: string;
  type: 'number' | 'text' | 'datetime' | 'json' | 'textarea' | 'date' | 'boolean' | 'select' | 'multiselect';
  isPrimaryKey?: boolean;
  readOnly?: boolean;
  visibleInList?: boolean;
  visibleInForm?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'date' | null;
  required?: boolean;
  maxLength?: number | null;
  unique?: boolean;
  defaultValue?: string | null;
  options?: { value: string | number; label: string }[]; // For select fields
  getDisplayValue?: (row: any) => string | number; // For custom display logic
}

export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
}

export interface ListConfig {
  defaultSort: {
    field: string;
    order: 'asc' | 'desc';
  };
  pageSize: number;
  columns: string[];
}

export interface FormConfig {
  fields: string[];
  validation: {
    [key: string]: {
      required?: string;
      maxLength?: string;
      unique?: string;
    };
  };
}

export interface FilterField {
  name: string;
  type: 'text' | 'date';
  label: string;
}

export interface FilterConfig {
  fields: FilterField[];
}

export interface ModuleConfig {
  table: string;
  displayName: string;
  apiBaseUrl: string;
  endpoints: {
    list: Endpoint;
    create: Endpoint;
    read: Endpoint;
    update: Endpoint;
    delete: Endpoint;
  };
  fields: Field[];
  listConfig: ListConfig;
  formConfig: FormConfig;
  filterConfig: FilterConfig;
}

export interface Modules {
  [key: string]: ModuleConfig;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiRecordResponse<> {
  [key: string]: any;
}