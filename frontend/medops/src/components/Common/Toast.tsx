import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number; // en ms, default 3000
}

const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const base =
    "fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-slide z-50";

  const styles = {
    success: `${base} bg-green-600 text-white`,
    error: `${base} bg-red-600 text-white`,
    info: `${base} bg-blue-600 text-white`,
  };

  return <div className={styles[type]}>{message}</div>;
};

export default Toast;
