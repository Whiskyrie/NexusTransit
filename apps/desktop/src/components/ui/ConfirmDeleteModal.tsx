import { X, AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  description?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
  description,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{title}</h3>
          <p className="text-sm text-gray-600">
            {description || (
              <>
                Tem certeza que deseja excluir{" "}
                <span className="font-semibold text-[#1A1A1A]">"{itemName}"</span>?
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4! py-2! text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isDeleting}
            className="px-4! py-2! text-sm bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
