import { Edit2, Trash2 } from "lucide-react";
import type { User } from "../../types/user.types";

interface UserActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserActions({ user, onEdit, onDelete }: UserActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => onEdit(user)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all cursor-pointer active:scale-95"
        title="Editar usuário"
      >
        <Edit2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onDelete(user)}
        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all cursor-pointer active:scale-95"
        title="Excluir usuário"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
