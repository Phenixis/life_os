'use client';

import {Button} from '@/components/ui/button';
import {ArrowRight, Loader2} from 'lucide-react';
import {useFormStatus} from 'react-dom';
import Link from "next/link";

export function SubmitButton(
    {
        isPopular,
        isFree,
        isActive = true
    }: {
        isPopular: boolean,
        isFree: boolean,
        isActive?: boolean
    }
) {
    const {pending} = useFormStatus();

    if (isFree) {
        return (
            <Link
                href={"/sign-up"}
            >
                <Button
                    type="submit"
                    disabled={pending}
                    variant={isPopular ? "default" : isActive ? "outline" : "ghost"}
                    className={`w-full ${isPopular ? "dark:text-black bg-blue-500 text-white lg:hover:bg-blue-600" : "border-gray-300 dark:border-gray-700"}`}
                >
                    {pending ? (
                        <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4"/>
                            Loading...
                        </>
                    ) : isActive ? (
                        <>
                            Get Started {isFree && "Free"}
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </>
                    ) : (
                        <>
                            Coming Soon
                        </>
                    )}
                </Button>
            </Link>
        )
    }

    return (
        <Button
            type="submit"
            disabled={pending}
            variant={isPopular ? "default" : isActive ? "outline" : "ghost"}
            className={`w-full ${isPopular ? "dark:text-black bg-blue-500 text-white lg:hover:bg-blue-600" : "border-gray-300 dark:border-gray-700"}`}
        >
            {pending ? (
                <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4"/>
                    Loading...
                </>
            ) : isActive ? (
                <>
                    Get Started {isFree && "Free"}
                    <ArrowRight className="ml-2 h-4 w-4"/>
                </>
            ) : (
                <>
                    Coming Soon
                </>
            )}
        </Button>
    );
}