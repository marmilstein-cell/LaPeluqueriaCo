"use client";
// BARDOS — hook compartido del catálogo (React Query)
import { useQuery } from "@tanstack/react-query";
import { fetchCatalog } from "@/lib/bardos/client";

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });
}
