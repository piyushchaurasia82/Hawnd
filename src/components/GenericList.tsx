import React, { useState, useEffect } from "react";
import api from "../services/api";
import type { ApiListResponse, ModuleConfig } from "../config/types";

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

// SVG icon components
const EyeIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12S5.25 5.25 12 5.25 22.5 12 22.5 12 18.75 18.75 12 18.75 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} /></svg>
);
const EditIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5l6.75-6.75a2.121 2.121 0 113 3L12 16.5H9v-3z" /></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);

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
          params: {
            page: page + 1,
            per_page: rowsPerPage,
            sort: orderBy,
            order,
            ...filters,
          },
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

  return (
    <div className="mt-4">
      <div className="overflow-auto">
        <table className="min-w-full border border-gray-200 text-sm">
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
                      <EyeIcon />
                    </button>
                    <button onClick={() => onEdit(row.id)} className="text-green-600 hover:text-green-800" title="Edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => onDelete(row.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <TrashIcon />
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
