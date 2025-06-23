import React from 'react';
import { MdVisibility, MdEdit, MdDelete } from 'react-icons/md';

interface ActionButtonsProps {
    id: number;
    onShow: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onShow, onEdit, onDelete }) => (
    <div className="flex space-x-3">
        <button onClick={onShow} className="text-blue-600 hover:text-blue-800">
            <MdVisibility size={20} />
        </button>
        <button onClick={onEdit} className="text-green-600 hover:text-green-800">
            <MdEdit size={20} />
        </button>
        <button onClick={onDelete} className="text-red-600 hover:text-red-800">
            <MdDelete size={20} />
        </button>
    </div>
);

export default ActionButtons;
