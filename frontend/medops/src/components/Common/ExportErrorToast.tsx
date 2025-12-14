// src/components/Common/ExportErrorToast.tsx
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

interface ExportErrorToastProps {
  errors: { category: string; error: string }[];
  onClose: () => void;
}

export default function ExportErrorToast({ errors, onClose }: ExportErrorToastProps) {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    const message = (
      <div className="text-sm">
        <p className="font-semibold mb-1">Error al generar documentos</p>
        <ul className="space-y-1">
          {errors.map((err, idx) => (
            <li key={idx}>
              <span className="font-medium">{err.category}:</span> {err.error}
            </li>
          ))}
        </ul>
      </div>
    );

    toast.error(message, {
      duration: 6000,
      style: {
        background: "#fee2e2",
        color: "#7f1d1d",
        border: "1px solid #fca5a5",
        padding: "12px 14px",
        borderRadius: "6px",
      },
    });

    hasShown.current = true;
    onClose();
  }, [errors, onClose]);

  return null;
}
