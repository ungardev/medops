import { useAuthToken } from "hooks/useAuthToken";

export function DevLogin() {
  const { saveToken } = useAuthToken();

  const handleSetToken = () => {
    saveToken("6d6bb3a135ac1ba88ff4502ecd8c1c697847ee89"); // 👈 tu token del servidor
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
