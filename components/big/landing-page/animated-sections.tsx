'use client'

import React, { useRef } from 'react'
import { useInView } from 'framer-motion'
import { MotionDiv } from "@/lib/services/motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface ProblemSectionProps {
    age: number
}

export function ProblemSection({ age }: ProblemSectionProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" })

    return (
        <section
            id="problem"
            ref={ref}
            className="px-6 py-12 bg-gray-50 dark:bg-gray-950"
        >
            <MotionDiv
                className="max-w-5xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
            >
                {/* Founder Introduction */}
                <div className="mb-12">
                    <h2 className="text-center text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">
                        Hi, I&apos;m Maxime, the founder of Life OS
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        I&apos;m {age}, and I'm doing quite a lot of things at the same time:<br /><br />
                        I'm studying Computer Science, I'm working as a Junior Developer for a small company, I'm building web apps for small shops and I built Life OS.<br /><br />
                        I know how it feels to be drowning in scattered tools like Notion, Google Keep, Obsidian, etc: you spend more time <span className="font-semibold">building</span> the system than <span className="font-semibold">using</span> the system.<br /><br />
                        So I built Life OS, my <span className="font-semibold">ultimate productivity system</span><span className='italic'> (Imagine the climax of an epic music behind...)</span>.<br /><br />
                        I aim to build the best and most complete application to help ambitious students and side-hustlers organize their life and work so they can focus on what matters: <span className="font-semibold">creating</span>.<br /><br />
                    </p>
                </div>

                {/* Before vs After */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Before */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-red-200 dark:border-red-800/30 hover:-translate-y-1 transition-transform">
                        <div className="flex items-center mb-4">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <h3 className="text-lg font-medium text-red-700 dark:text-red-400">Before Life OS</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• App-switching every few minutes</li>
                            <li>• Missing important deadlines</li>
                            <li>• Spending more time organizing than working</li>
                            <li>• Constant anxiety about forgetting things</li>
                        </ul>
                    </div>

                    {/* After */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-green-200 dark:border-green-800/30 hover:-translate-y-1 transition-transform">
                        <div className="flex items-center mb-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <h3 className="text-lg font-medium text-green-700 dark:text-green-400">After Life OS</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Everything in one place</li>
                            <li>• Never miss deadlines with smart reminders</li>
                            <li>• Focus on creating, not managing systems</li>
                            <li>• Calm confidence knowing nothing slips through</li>
                        </ul>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link href="/sign-up">
                        <Button 
                            size="lg" 
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 hover:scale-105 active:scale-95 transition-transform"
                        >
                            Discover Life OS
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </MotionDiv>
        </section>
    )
}

export function BenefitsSection() {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" })

    return (
        <section
            id="benefits"
            ref={ref}
            className="px-6 py-16 bg-gray-50 dark:bg-gray-950 min-h-screen flex items-center"
        >
            <MotionDiv
                className="max-w-6xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
            >
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">Transform chaos into clarity</h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        See how Life OS shifts you from reactive firefighting to proactive, goal-driven progress.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="text-center">
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg mb-6 hover:scale-[1.02] hover:-translate-y-1 transition-transform">
                            <h4 className="font-medium font-heading text-red-700 dark:text-red-400 mb-3">Before Life OS</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>📱 App-hopping between tools</li>
                                <li>📝 Scattered sticky notes</li>
                                <li>😰 Missed deadlines</li>
                                <li>🧠 Mental overload</li>
                                <li>⏰ Wasted time searching</li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-lg mb-6 hover:scale-[1.02] hover:-translate-y-1 transition-transform">
                            <h4 className="font-medium font-heading text-yellow-700 dark:text-yellow-400 mb-3">The Transition</h4>
                            <div className="text-4xl mb-4 rotate-85 md:rotate-0">→</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Simple setup, intuitive interface, and immediate organization of your existing chaos.
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg mb-6 hover:scale-[1.02] hover:-translate-y-1 transition-transform">
                            <h4 className="font-medium font-heading text-green-700 dark:text-green-400 mb-3">After Life OS</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>✨ Single source of truth</li>
                                <li>🎯 Clear daily priorities</li>
                                <li>📈 Consistent progress</li>
                                <li>😌 Mental clarity</li>
                                <li>🚀 Confident execution</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-xl font-medium tracking-wide mb-6 font-heading">The Life OS Difference</h3>
                        <div className="space-y-6">
                            <div className="flex items-center">
                                <div className="w-12 aspect-square bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">1</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    See every task, note, and deadline in one place. Cut context-switching by 50%
                                    and never lose track of important commitments again.
                                </p>
                            </div>

                            <div className="flex items-center">
                                <div className="w-12 aspect-square bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">2</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Gain calm confidence knowing nothing slips through the cracks.
                                    Feel in control of your ambitious goals and complex schedule.
                                </p>
                            </div>

                            <div className="flex items-center">
                                <div className="w-12 aspect-square bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                    <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">3</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Impress peers and mentors when you deliver reliably and stay ahead of deadlines.
                                    Build a reputation for being organized and dependable.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8 rounded-xl">
                        <h4 className="font-medium font-heading mb-4 text-center">Weekly Impact</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Time saved per week</span>
                                <span className="font-medium">8+ hours</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Stress reduction</span>
                                <span className="font-medium">Significant</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Deadline compliance</span>
                                <span className="font-medium">95%+</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Mental clarity</span>
                                <span className="font-medium">High</span>
                            </div>
                        </div>
                    </div>
                </div>
            </MotionDiv>
        </section>
    )
}

export function CTASection() {
    return (
        <section className="px-6 py-20 bg-black dark:bg-white text-white dark:text-black">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">
                    Make space for what matters
                </h2>
                <p className="text-base opacity-90 mb-8 max-w-2xl mx-auto">
                    Join ambitious students who&apos;ve transformed chaos into clarity.
                    Your future self will thank you.
                </p>
                <Link href="/sign-up">
                    <Button 
                        size="lg"
                        className="bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 px-8 hover:scale-105 active:scale-95 transition-transform"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </section>
    )
}
