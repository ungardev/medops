import { useAuthToken } from "hooks/useAuthToken";

export function DevLogin() {
  const { saveToken } = useAuthToken();

  const handleSetToken = () => {
    // ✅ Leer token desde variables de entorno
    const devToken = import.meta.env.VITE_DEV_TOKEN;
    if (devToken) {
      saveToken(devToken);
    } else {
      console.warn("⚠️ No se encontró VITE_DEV_TOKEN en .env.development");
    }
  };

  return (
    <button
      onClick={handleSetToken}
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        padding: "6px 12px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      Usar token de desarrollo
    </button>
  );
}
