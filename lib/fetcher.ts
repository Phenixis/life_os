// A simple fetcher function for SWR
export const fetcher = async (url: string, api_key: string) => {
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${api_key}`
    }
  })

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.") as Error & { info?: unknown; status?: number }
    // Attach extra info to the error object.
    const info = await res.json()
    error.info = info
    error.status = res.status
    throw error
  }

  return res.json()
}

/**
 * Base fetch wrapper with auth
 */
export async function fetchWithAuth<T>(url: string, apiKey: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...options?.headers,
        }
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`)
    }

    return res.json()
}