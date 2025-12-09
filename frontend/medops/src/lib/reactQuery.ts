import { QueryClient, keepPreviousData } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 15_000,
      gcTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData, // ⚔️ más limpio
    },
  },
});
