import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import LogoSVG from '@/public/logo.svg'

export default function Logo({
    className,
    size = 16,
    title = false,
}: {
    className?: string,
    size?: number,
    title?: boolean
}) {
    return (
        <Link href="/" className={cn("flex items-center gap-2", className)}>
            <Image src={LogoSVG} width={size} height={size} alt="list-style" className="bg-white rounded" priority />
            {
                title && (
                    <h1
                        className="text-xl font-medium tracking-wide font-heading lg:hover:text-gray-600 dark:lg:hover:text-gray-300 transition-colors"
                    >
                        Life OS
                    </h1>
                )
            }
        </Link>
    )
}