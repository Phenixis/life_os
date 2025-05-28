import './globals.css'
import type { Metadata } from 'next'
import { Domine, Geist_Mono, Ubuntu_Sans_Mono } from 'next/font/google';
import {
    TooltipProvider
} from "@/components/ui/tooltip"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from "@/components/ui/sonner"
import { darkMode } from "@/lib/flags"

const domine = Domine({
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    subsets: ['latin'],
})

const ubuntuSansMono = Ubuntu_Sans_Mono({
    subsets: ['latin'],
})

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://life-os.xyz'),
    title: {
        default: 'Life OS',
        template: '%s | Life OS',
    },
    description: 'Your life, all in one place.',
    openGraph: {
        title: "Life OS",
        description: "Your life, all in one place.",
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://life-os.xyz',
        siteName: "Life OS",
        locale: 'en_US',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

const cx = (...classes: string[]) => classes.filter(Boolean).join(' ')

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const isDarkMode = await darkMode()
    return (
        <html
            lang="en"
            className={"overflow-x-hidden" + (isDarkMode ? 'dark' : '')}
        >
            <head>
                <link rel="icon" href="/favicon.png" sizes='any' />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body className={cx(
                'antialiased text-black bg-white dark:text-white dark:bg-black h-full min-h-screen w-full min-w-screen max-w-screen',
                domine.className,
                geistMono.className,
                ubuntuSansMono.className,
            )}>
                <TooltipProvider>
                    {children}
                </TooltipProvider>
                <SpeedInsights />
                <Analytics />
                <Toaster />
            </body>
        </html>
    )
}
