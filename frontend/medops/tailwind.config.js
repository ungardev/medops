// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 🔹 Modo claro institucional
        bgLight: "#f3f4f6",           // fondo claro institucional
        surfaceLight: "#ffffff",      // tarjetas blancas
        textLight: "#1f2937",         // texto principal gris oscuro
        textMuted: "#6b7280",         // texto secundario
        borderLight: "#e5e7eb",       // borde claro

        // 🔹 Modo oscuro institucional
        bgDark: "#111827",
        surfaceDark: "#1f2937",
        textDark: "#e5e7eb",
        textDarkMuted: "#9ca3af",
        borderDark: "#374151",

        // 🔹 Tokens universales
        primary: "#3b82f6",
        muted: "#6b7280",
        accentDark: "#f59e0b",
      },
    },
  },
  plugins: [],
};
