// hooks/use-filtered-data.ts
"use client"

import { fetcher } from "@/lib/fetcher"
import useSWR from "swr"
import { useUser } from "./use-user"

export function useFilteredData<T>({
  endpoint,
  params,
  skipFetch = false,
}: {
  endpoint: string
  params?: Record<string, string | number | boolean | undefined>
  skipFetch?: boolean
}) {
  const { user } = useUser()

  const resolvedKey = user?.api_key || ""
  
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
  }

  // Create the SWR key
  const swrKey = skipFetch ? null : `${endpoint}?${searchParams.toString()}`

  // Fetch data using SWR
  const { data, error, isLoading, mutate } = useSWR(swrKey, (url) => fetcher(url, resolvedKey), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000, // Reduced back to allow better reactivity
    revalidateIfStale: true, // Allow revalidation when data is stale
    refreshInterval: 0, // Disable automatic polling
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })


  return {
    data: skipFetch ? ([] as unknown as T) : data,
    isLoading: skipFetch ? false : isLoading,
    isError: skipFetch ? undefined : error,
    mutate,
  }
}
