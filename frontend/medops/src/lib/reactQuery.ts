import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { keepPreviousData } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      placeholderData: keepPreviousData,
      refetchOnMount: false,
    },
  },
});

export async function initQueryPersistence() {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "medops-query-cache",
  });

  try {
    await persistQueryClient({
      queryClient,
      persister,
      maxAge: 30 * 60 * 1000,
    });
  } catch {
    console.warn("Query cache persistence failed - continuing without persistence");
  }
}