'use client'

import React, { useRef } from 'react'
import { useInView } from 'framer-motion'
import { MotionDiv } from "@/lib/services/motion"
import { CheckCircle, Sparkles } from "lucide-react"

interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
    features: string[]
    valueProposition: string
    isReversed?: boolean
    delay?: number
}

export function FeatureCard({
    icon,
    title,
    description,
    features,
    valueProposition,
    isReversed = false,
}: FeatureCardProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-100px" })

    return (
        <MotionDiv
            ref={ref}
            className="min-h-screen flex items-center py-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
        >
            <div className={`grid lg:grid-cols-2 gap-16 items-center w-full ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-8 ${isReversed ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center mr-6 hover:scale-110 hover:rotate-3 transition-transform">
                            {icon}
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-medium font-heading">{title}</h3>
                    </div>

                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {description}
                    </p>

                    {/* Value Proposition Highlight */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-xl border-l-4 border-blue-500 hover:scale-[1.02] transition-transform">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                {valueProposition}
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start text-lg">
                                <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`relative ${isReversed ? 'lg:order-1' : ''} hover:scale-[1.02] transition-transform`}>
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl" />

                    {/* Content */}
                    <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-2xl p-12 min-h-[500px] flex flex-col items-center justify-center border border-gray-200/50 dark:border-gray-700/50">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                                <div className="w-16 h-16 text-4xl">
                                    {icon}
                                </div>
                            </div>
                            <p className="text-xl font-medium">{title} Interface</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Designed for efficiency and clarity
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MotionDiv>
    )
}
