import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }

    hasShown.current = true;
    onClose();
  }, [message, type, onClose]);

  return null;
}
