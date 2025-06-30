import React, { useState, useEffect } from "react";
import api from "../services/api";
import type { ApiListResponse, ModuleConfig } from "../config/types";
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

interface GenericListProps {
  config: ModuleConfig;
  filters: { [key: string]: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onShow: (id: number) => void;
}

// Utility to truncate to 20 words and add .....
function truncateWords(text: string, wordLimit = 20) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '.....';
}

// DescriptionCell component
const DescriptionCell: React.FC<{ description: string }> = ({ description }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span
        title={description}
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        {truncateWords(description)}
      </span>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 24,
            zIndex: 1000,
            minWidth: 300,
            maxWidth: 500,
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ marginBottom: 16, fontWeight: 'bold' }}>Full Description</div>
          <div style={{ marginBottom: 16, whiteSpace: 'pre-line' }}>{description}</div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

const dummyProjects = [
  {
    id: 1,
    title: 'Website Redesign',
    owner: 'Emily Carter',
    status: 'In Progress',
    completed: 60,
    type: 'Marketing',
  },
  {
    id: 2,
    title: 'Mobile App Development',
    owner: 'David Lee',
    status: 'Completed',
    completed: 100,
    type: 'Product',
  },
  {
    id: 3,
    title: 'Content Marketing Strategy',
    owner: 'Sarah Chen',
    status: 'Todo',
    completed: 20,
    type: 'Marketing',
  },
  {
    id: 4,
    title: 'Sales Training Program',
    owner: 'Michael Brown',
    status: 'In Progress',
    completed: 40,
    type: 'Sales',
  },
  {
    id: 5,
    title: 'Customer Support Portal',
    owner: 'Jessica Wong',
    status: 'Completed',
    completed: 100,
    type: 'Support',
  },
  {
    id: 6,
    title: 'Product Launch Campaign',
    owner: 'Daniel Kim',
    status: 'Todo',
    completed: 10,
    type: 'Marketing',
  },
  {
    id: 7,
    title: 'Internal Tools Upgrade',
    owner: 'Olivia Green',
    status: 'In Progress',
    completed: 50,
    type: 'IT',
  },
  {
    id: 8,
    title: 'Market Research Study',
    owner: 'Ethan Clark',
    status: 'Completed',
    completed: 100,
    type: 'Research',
  },
  {
    id: 9,
    title: 'Partnership Development',
    owner: 'Sophia Davis',
    status: 'Todo',
    completed: 30,
    type: 'Business',
  },
  {
    id: 10,
    title: 'Employee Onboarding Process',
    owner: 'Ryan Taylor',
    status: 'In Progress',
    completed: 70,
    type: 'HR',
  },
];

const GenericList: React.FC<GenericListProps> = ({
  config,
  filters,
  onEdit,
  onDelete,
  onShow,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(config.listConfig.pageSize);
  const [order, setOrder] = useState<"asc" | "desc">(
    config.listConfig.defaultSort.order
  );
  const [orderBy, setOrderBy] = useState<string>(
    config.listConfig.defaultSort.field
  );
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, order, orderBy, filters]);

  const fetchData = async () => {
    try {
      const response = await api.get<ApiListResponse<any>>(
        `${config.apiBaseUrl}${config.endpoints.list.url}/`,
        {
          // params: {
          //   page: page + 1,
          //   per_page: rowsPerPage,
          //   sort: orderBy,
          //   order,
          //   ...filters,
          // },
        }
      );
      setData(response.data.data || response.data);
      if (response.data.data && response.data.data.length > 0) {
        setTotalCount(response.data.total || response.data.data.length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSort = (field: string) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Use dummy data and custom columns for projects module
  const isProjectsModule = config.table === 'projects';
  if (isProjectsModule) {
    return (
      <tbody className="border border-[#EAEAEA]">
        <tr className="bg-gray-100 text-gray-700 text-left">
          <th className="px-4 py-3 whitespace-nowrap font-medium">Project Title</th>
          <th className="px-4 py-3 whitespace-nowrap font-medium">Owner</th>
          <th className="px-4 py-3 whitespace-nowrap font-medium">Status</th>
          <th className="px-4 py-3 whitespace-nowrap font-medium">Priority</th>
          <th className="px-4 py-3 whitespace-nowrap font-medium">Actions</th>
        </tr>
        {data.map((row) => (
          <tr key={row.id} className="border-t">
            <td className="px-4 py-4">
              <button 
                onClick={() => onShow(row.id)} 
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
              <div className="flex space-x-3">
                <button onClick={() => onEdit(row.id)} className="text-black" title="Edit">
                  <FiEdit size={18} />
                </button>
                <button onClick={() => onDelete(row.id)} className="text-red-600 hover:text-red-800" title="Delete">
                  <FiTrash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              {config.listConfig.columns.map((column) => {
                const field = config.fields.find((f) => f.name === column);
                return (
                  field?.visibleInList && (
                    <th key={column} className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-1 font-medium"
                      >
                        {field.label}
                        {orderBy === column && (
                          <span>{order === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </th>
                  )
                );
              })}
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                {config.listConfig.columns.map((column) => {
                  const field = config.fields.find((f) => f.name === column);
                  const cellValue = field?.getDisplayValue ? field.getDisplayValue(row) : row[column];
                  return (
                    field?.visibleInList && (
                      <td key={column} className="px-4 py-2">
                        {field.name === 'description' ? <DescriptionCell description={cellValue as string} /> : cellValue}
                      </td>
                    )
                  );
                })}
                <td className="px-4 py-2">
                  <div className="flex space-x-3">
                    <button onClick={() => onShow(row.id)} className="text-blue-600 hover:text-blue-800" title="View">
                      <FiEye size={18} />
                    </button>
                    <button onClick={() => onEdit(row.id)} className="text-black" title="Edit">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => onDelete(row.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <label className="text-sm mr-2">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[5, 10, 25].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleChangePage(page - 1)}
            disabled={page === 0}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page + 1} of {totalPages || 1}
          </span>
          <button
            onClick={() => handleChangePage(page + 1)}
            disabled={page + 1 >= totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericList;
