// src/pages/Auth/Login.tsx
import { useState } from "react";
import { useAuthToken } from "hooks/useAuthToken";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { saveToken } = useAuthToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiRoot = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";
      const res = await fetch(`${apiRoot}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Credenciales inválidas");

      const data = await res.json();
      if (!data.token) throw new Error("Respuesta inválida del servidor");

      saveToken(data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-sm text-center"
      >
        {/* Logo institucional desde /public */}
        <img
          src="/logo-medops-light.svg"
          alt="MedOps Logo"
          className="mx-auto mb-6 w-28 h-28 object-contain dark:hidden"
        />
        <img
          src="/logo-medops-dark.svg"
          alt="MedOps Logo"
          className="mx-auto mb-6 w-28 h-28 object-contain hidden dark:block"
        />

        <h2 className="text-2xl font-bold text-[#0d2c53] dark:text-white mb-6 font-manrope">
          Iniciar sesión
        </h2>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>

        <div className="mb-4 text-left">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0d2c53] hover:bg-[#143d72] text-white py-2 rounded-md text-sm font-medium transition"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
