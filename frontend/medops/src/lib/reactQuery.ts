// src/lib/reactQuery.ts
import { QueryClient } from "@tanstack/react-query";

// 🔹 Cliente institucional de React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
