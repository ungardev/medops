// src/components/Dashboard/metricsConfig.ts
import { CurrencyDollarIcon, ClipboardIcon, ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export const metricsConfig = {
  scheduled_count: {
    label: "Citas agendadas",
    icon: ClipboardIcon,
    color: "text-blue-600 dark:text-blue-400",
    href: "/appointments", // 🔹 apunta al page correcto
  },
  pending_count: {
    label: "Pendientes",
    icon: ClockIcon,
    color: "text-yellow-600 dark:text-yellow-400",
    href: "/appointments?status=pending", // 🔹 mismo page con filtro aplicado
  },
  waiting_count: {
    label: "En espera",
    icon: ClockIcon,
    color: "text-purple-600 dark:text-purple-400",
    href: "/waitingroom", // 🔹 ajustado al route real de WaitingRoom.tsx
  },
  in_consultation_count: {
    label: "En consulta",
    icon: ClipboardIcon,
    color: "text-indigo-600 dark:text-indigo-400",
    href: "/consultation", // 🔹 ahora apunta al page Consultation.tsx
  },
  completed_count: {
    label: "Finalizadas",
    icon: CheckCircleIcon,
    color: "text-green-600 dark:text-green-400",
    href: "/appointments?status=completed", // 🔹 también ajustado al mismo page
  },
  total_amount: {
    label: "Total ($)",
    icon: CurrencyDollarIcon,
    color: "text-gray-800 dark:text-white",
    href: "/payments", // 🔹 apunta al page Payments.tsx
  },
  payments_count: {
    label: "Pagos",
    icon: CurrencyDollarIcon,
    color: "text-green-600 dark:text-green-400",
    href: "/payments", // 🔹 ahora también apunta a /payments
  },
  exempted_count: {
    label: "Exonerado",
    icon: CurrencyDollarIcon,
    color: "text-red-600 dark:text-red-400",
    href: "/payments", // 🔹 ahora también apunta a /payments
  },
};
