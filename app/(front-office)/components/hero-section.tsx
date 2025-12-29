'use client'

import React, { useRef } from 'react'
import { useScroll, useTransform } from 'framer-motion'
import { MotionSection } from "@/lib/services/motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef as React.RefObject<HTMLElement>,
        offset: ["start start", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <div ref={containerRef}>
            <MotionSection
                className="px-6 py-20 text-center max-w-6xl mx-auto relative overflow-hidden"
                style={{ y, opacity }}
            >
                {/* Static decorative blobs - no animation */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-red-500/10 to-blue-500/10 rounded-full blur-xl" />
                <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl" />

                <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Badge variant="outline" className="mb-6 border-gray-300 dark:border-gray-700">
                        Your Personal Command Center
                    </Badge>

                    <h1 className="w-full text-3xl md:text-5xl font-medium tracking-wide mb-6 leading-tight font-heading">
                        Life OS is your
                        <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent"> operating system</span>
                        <br />for a cluttered life
                    </h1>

                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Built for ambitious students and side-hustlers who juggle classes, internships, and creative
                        projects.<br />
                        No more app-hopping or sticky notes. Just clarity, focus, and forward momentum in one minimal
                        interface.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
                        <Link href="/sign-up">
                            <Button 
                                size="lg"
                                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 hover:scale-105 active:scale-95 transition-transform"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Join the growing community of organized achievers
                    </p>
                </div>
            </MotionSection>
        </div>
    )
}
