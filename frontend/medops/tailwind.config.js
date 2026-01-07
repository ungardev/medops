// tailwind.config.js
module.exports = {
  darkMode: "class", 
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Inter es el estándar de oro para interfaces médicas y técnicas
        sans: ["Inter", "Manrope", "ui-sans-serif", "system-ui"],
      },
      screens: {
        lg: "1280px", 
      },
      colors: {
        // --- SISTEMA DE IDENTIDAD MEDOPZ ---
        brand: {
          primary: "#38a1ff",   // Azul institucional MedOps
          success: "#0f9960",   // Estados positivos / Finalizados
          error: "#db3737",     // Emergencias / Errores
          warning: "#d9822b",   // Pendientes / Alertas
          info: "#215db0",      // Informativo técnico
        },
        ui: {
          // DARK MODE (Elite Deep Palette)
          dark: {
            bg: "#0f131a",      // Fondo base profundo
            surface: "#182026", // Tarjetas y Sidebar
            header: "#10161a",  // Cabecera anclada
            border: "#24313c",  // Bordes de alta precisión
            hover: "#202b33",   // Estados de hover en listas
          },
          // LIGHT MODE (Pristine Clinical Palette)
          light: {
            bg: "#f5f8fa",      // Fondo gris clínico suave
            surface: "#ffffff", // Tarjetas blancas puras
            border: "#d8e1e8",  // Bordes sutiles claros
            hover: "#ebf1f5",   // Hover claro
          }
        },
        text: {
          // Tokens de texto para garantizar legibilidad
          dark: {
            main: "#f5f8fa",    // Texto principal
            muted: "#8a9ba8",   // Texto secundario / Meta-data
            disabled: "#5c7080",
          },
          light: {
            main: "#182026",    // Texto principal
            muted: "#5c7080",   // Texto secundario
            disabled: "#a7b6c2",
          }
        }
      },
      boxShadow: {
        // Ring Elevation: sombras técnicas que no ensucian el diseño
        'elite-sm': '0 0 0 1px rgba(16, 22, 26, 0.2), 0 1px 1px rgba(16, 22, 26, 0.4)',
        'elite-md': '0 0 0 1px rgba(16, 22, 26, 0.15), 0 2px 4px rgba(16, 22, 26, 0.3), 0 8px 24px rgba(16, 22, 26, 0.3)',
      },
      borderRadius: {
        // El radio 'elite' elimina el aspecto de "juguete" de los bordes redondos
        'elite': '2px',
      }
    },
  },
  plugins: [],
};
