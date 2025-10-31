// src/context/NotifyContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type NotifyType = "success" | "error" | "info";

interface Notification {
  id: number;
  type: NotifyType;
  message: string;
}

interface NotifyContextProps {
  notify: (type: NotifyType, message: string) => void;
}

const NotifyContext = createContext<NotifyContextProps | undefined>(undefined);

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (type: NotifyType, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000); // auto-dismiss
  };

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      {/* Render de toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded shadow text-white ${
              n.type === "success"
                ? "bg-green-600"
                : n.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify debe usarse dentro de NotifyProvider");
  return ctx.notify;
}
