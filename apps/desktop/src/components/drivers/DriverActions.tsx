import { Edit2, Trash2 } from "lucide-react";

interface DriverActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function DriverActions({ onEdit, onDelete }: DriverActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
        title="Editar motorista"
      >
        <Edit2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
        title="Excluir motorista"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
