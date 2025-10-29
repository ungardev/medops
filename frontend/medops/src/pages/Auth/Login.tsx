import { useState } from "react";
import { useAuthToken } from "hooks/useAuthToken";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { saveToken } = useAuthToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api"}/auth/token/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!res.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await res.json();
      if (!data.token) {
        throw new Error("Respuesta inválida del servidor");
      }

      saveToken(data.token); // guarda el token en localStorage
      navigate("/"); // redirige al dashboard
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
