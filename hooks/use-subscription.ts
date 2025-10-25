"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'

interface Subscription {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    productId: string
    priceId: string
    trialEnd?: string
    canceledAt?: string
}

interface SubscriptionStatus {
    hasActiveSubscription: boolean
    subscription: Subscription | null
}

export function useSubscription() {
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useUser()

    const fetchSubscriptionStatus = async () => {
        if (!user) {
            setSubscriptionStatus({ hasActiveSubscription: false, subscription: null })
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/stripe/subscription-status', {
                headers: {
                    'Authorization': `Bearer ${user.api_key}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch subscription status')
            }

            const data = await response.json()
            setSubscriptionStatus(data)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription'
            setError(errorMessage)
            console.error('Error fetching subscription status:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSubscriptionStatus()
    }, [user])

    return {
        subscriptionStatus,
        isLoading,
        error,
        refetch: fetchSubscriptionStatus
    }
}
