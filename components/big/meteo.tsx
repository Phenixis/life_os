'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    type Meteo
} from '@/lib/db/schema';
import { Loader2, CircleAlert } from 'lucide-react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import Image from 'next/image'
import { useUser } from '@/hooks/use-user';
export default function Meteo({
    className,
}: {
    className?: string
}) {
    const user = useUser().user;
    const now = new Date();
    const date = now.getHours() >= 19
        ? new Date(now.setDate(now.getDate() + 1)).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : now.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const [meteo, setMeteo] = useState<Meteo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fetchWeather = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(`/api/weather?day=${date}&lat=${latitude}&lon=${longitude}`, {
                headers: {
                    "Authorization": `Bearer ${user?.api_key}`
                }
            });

            const data = await response.json() as Meteo;

            setMeteo(data);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    setError('Failed to get location');
                }
            );
        } else {
            setError('Geolocation is not supported by this browser');
        }
    };

    useEffect(() => {
        getLocation();
    }, [error]);

    if (error) {
        return (
            <Tooltip>
                <TooltipTrigger className="hidden xl:group-hover/Time:block">
                    <CircleAlert className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {error}
                    </p>
                </TooltipContent>
            </Tooltip>
        )
    }

    if (!meteo) {
        return <Loader2 className='animate-spin' />;
    }

    return (
        <Tooltip>
            <TooltipTrigger className={cn("text-center text-xs xl:text-sm flex flex-col justify-center items-center cursor-default", className)}>
                <Image
                    src={`https://openweathermap.org/img/wn/${meteo.icon}@2x.png`}
                    className="size-10 xl:transform duration-300 xl:translate-y-3 xl:group-hover/Time:-translate-y-0"
                    alt="Weather icon"
                    width={40}
                    height={40}
                />
                <p className="duration-300 -translate-y-2 xl:transform xl:-translate-y-4 xl:opacity-0 xl:group-hover/Time:opacity-100 xl:group-hover/Time:-translate-y-2">{meteo.temperature.toFixed(0)}°C</p>
            </TooltipTrigger>
            <TooltipContent>
                <p className="text-sm text-center">
                    {date !== (new Date()).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) ? 'Tomorrow, ' : 'Today, '} {meteo.summary}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}