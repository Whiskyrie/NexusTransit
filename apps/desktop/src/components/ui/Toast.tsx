import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

const toastConfig = {
  success: {
    bg: "bg-emerald-500",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-red-500",
    icon: XCircle,
  },
  warning: {
    bg: "bg-amber-500",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-500",
    icon: Info,
  },
};

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-200 ${config.bg} text-white`}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        ×
      </button>
    </div>
  );
}
