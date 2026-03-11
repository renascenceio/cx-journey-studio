import useSWR from "swr"
import type { Archetype } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useArchetypes() {
  const { data, error, isLoading, mutate } = useSWR<Archetype[]>("/api/archetypes", fetcher)
  return { archetypes: data ?? [], error, isLoading, mutate }
}

export function useArchetype(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Archetype>(
    id ? `/api/archetypes/${id}` : null,
    fetcher
  )
  return { archetype: data ?? null, error, isLoading, mutate }
}
