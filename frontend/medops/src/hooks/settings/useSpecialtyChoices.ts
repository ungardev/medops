// src/hooks/settings/useSpecialtyChoices.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useSpecialtyChoices() {
  return useQuery({
    queryKey: ["specialty-choices"],
    queryFn: async () => {
      const res = await axios.get("/choices/specialty/");
      return res.data; // [{id, code, name}]
    },
  });
}
