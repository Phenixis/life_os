"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5000,
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: false,
                        retry: 3,
                        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
                    },
                },
            })
    )

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return null
    }

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}