// src/hooks/useNotify.ts
import { useCallback } from "react";

type NotifyType = "success" | "error" | "info";

export function useNotify() {
  const notify = useCallback((type: NotifyType, message: string) => {
    // MVP: usar alert() o console.log
    // Futuro: reemplazar por un toast de TailAdmin
    if (type === "success") {
      console.log("SUCCESS:", message);
      alert(message);
    } else if (type === "error") {
      console.error("ERROR:", message);
      alert(message);
    } else {
      console.log("INFO:", message);
      alert(message);
    }
  }, []);

  return {
    success: (msg: string) => notify("success", msg),
    error: (msg: string) => notify("error", msg),
    info: (msg: string) => notify("info", msg),
  };
}
