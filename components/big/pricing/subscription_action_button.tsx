'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';

export function SubscriptionActionButton({ 
    priceId, 
    planName,
    isFree 
}: { 
    priceId: string, 
    planName: string,
    isFree: boolean 
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useUser();

    const handleCancel = async () => {
        if (!user?.api_key) {
            toast.error('Authentication required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/stripe/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.api_key}`
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel subscription');
            }

            toast.success('Subscription will be cancelled at the end of the current period');
            router.refresh();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = async () => {
        if (!user?.api_key) {
            toast.error('Authentication required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/stripe/change-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.api_key}`
                },
                body: JSON.stringify({ priceId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to change subscription');
            }

            toast.success(`Successfully changed to ${planName} plan`);
            router.refresh();
        } catch (error) {
            console.error('Error changing subscription:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to change subscription');
        } finally {
            setLoading(false);
        }
    };

    if (isFree) {
        return (
            <Button
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                className="w-full"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                    </>
                ) : (
                    <>
                        Cancel Subscription
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        );
    }

    return (
        <Button
            onClick={handleChange}
            disabled={loading}
            variant="default"
            className="w-full"
        >
            {loading ? (
                <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                </>
            ) : (
                <>
                    Change to {planName}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    );
}
