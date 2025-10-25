/**
 * Formats a price amount from cents to currency string
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'EUR')
 * @param locale - Locale for formatting (default: 'fr-FR')
 * @returns Formatted price string
 */
export function formatPrice(
    amount: number, 
    currency: string = 'EUR', 
    locale: string = 'fr-FR'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100)
}

/**
 * Formats a billing interval for display
 * @param interval - Billing interval ('month', 'year', etc.)
 * @returns Human-readable billing interval
 */
export function formatBillingInterval(interval: string): string {
    switch (interval) {
        case 'month':
            return 'month'
        case 'year':
            return 'year'
        case 'week':
            return 'week'
        case 'day':
            return 'day'
        default:
            return interval
    }
}

/**
 * Calculates savings percentage for yearly vs monthly billing
 * @param monthlyAmount - Monthly price in cents
 * @param yearlyAmount - Yearly price in cents
 * @returns Savings percentage rounded to nearest integer
 */
export function calculateYearlySavings(
    monthlyAmount: number, 
    yearlyAmount: number
): number {
    const monthlyTotal = monthlyAmount * 12
    const savings = ((monthlyTotal - yearlyAmount) / monthlyTotal) * 100
    return Math.round(savings)
}

/**
 * Determines if a subscription is in trial period
 * @param trialEnd - Trial end date string or null
 * @returns True if still in trial
 */
export function isInTrial(trialEnd: string | null): boolean {
    if (!trialEnd) return false
    return new Date(trialEnd) > new Date()
}

/**
 * Gets days remaining in trial
 * @param trialEnd - Trial end date string or null
 * @returns Number of days remaining (0 if no trial or expired)
 */
export function getTrialDaysRemaining(trialEnd: string | null): number {
    if (!trialEnd) return 0
    const endDate = new Date(trialEnd)
    const now = new Date()
    if (endDate <= now) return 0
    
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

/**
 * Formats a subscription status for display
 * @param status - Stripe subscription status
 * @returns User-friendly status string
 */
export function formatSubscriptionStatus(status: string): string {
    switch (status) {
        case 'active':
            return 'Active'
        case 'canceled':
            return 'Cancelled'
        case 'incomplete':
            return 'Payment Required'
        case 'incomplete_expired':
            return 'Expired'
        case 'past_due':
            return 'Past Due'
        case 'trialing':
            return 'Trial'
        case 'unpaid':
            return 'Unpaid'
        default:
            return status.charAt(0).toUpperCase() + status.slice(1)
    }
}
