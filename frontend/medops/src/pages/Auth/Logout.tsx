// src/pages/Auth/Logout.tsx
import { useEffect } from 'react';
import { useAuthToken } from '@/hooks/useAuthToken';
import { useNavigate } from 'react-router-dom';
export default function Logout() {
  const { clearToken } = useAuthToken();
  const navigate = useNavigate();
  useEffect(() => {
    clearToken();
    navigate('/login');
  }, [clearToken, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70 text-sm">Cerrando sesión...</p>
      </div>
    </div>
  );
}