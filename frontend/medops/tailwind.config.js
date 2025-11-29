// tailwind.config.js
module.exports = {
  darkMode: "class", // 🔹 habilita dark mode por clase
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"], // 🔹 fuente institucional
      },
      colors: {
        // 🔹 Tokens claros
        bgLight: "#f3f4f6",           // fondo claro institucional
        surfaceLight: "#ffffff",      // tarjetas blancas
        textLight: "#1f2937",         // texto principal gris oscuro
        textMuted: "#6b7280",         // texto secundario
        borderLight: "#e5e7eb",       // borde claro

        // 🔹 Tokens oscuros
        bgDark: "#111827",            // fondo principal oscuro
        surfaceDark: "#1f2937",       // tarjetas en dark
        textDark: "#e5e7eb",          // texto principal en dark
        textDarkMuted: "#9ca3af",     // texto secundario en dark
        borderDark: "#374151",        // borde en dark

        // 🔹 Tokens universales
        primary: "#3b82f6",           // azul institucional
        muted: "#6b7280",             // texto secundario
        accentDark: "#f59e0b",        // acento premium en dark
      },
    },
  },
  plugins: [],
};
