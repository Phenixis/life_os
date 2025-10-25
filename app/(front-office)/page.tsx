'use client'

import React, {useRef, useState} from 'react'
import {useInView, useScroll, useTransform} from 'framer-motion'
import {
    MotionDiv,
    MotionH1,
    MotionH2,
    MotionLi,
    MotionP,
    MotionSection,
    MotionSpan,
    MotionUl
} from "@/lib/services/motion"
import {Badge} from "@/components/ui/badge"
import {Switch} from "@/components/ui/switch"
import {Button} from "@/components/ui/button"
import {ArrowRight, CheckCircle, Shield, Sparkles, Target, Users, Zap} from "lucide-react"
import Link from "next/link"
import PricingCard from '@/components/big/pricing/pricing_card'
import {basic, free, pro} from "@/app/(back-office)/my/settings/subscription/plans";

export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const {scrollYProgress} = useScroll({
        target: containerRef as React.RefObject<HTMLElement>,
        offset: ["start start", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    // Animation variants
    const staggerContainer = {
        initial: {},
        animate: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    }

    const staggerItem = {
        initial: {opacity: 0, y: 20},
        animate: {
            opacity: 1,
            y: 0,
            transition: {duration: 0.5, ease: "easeOut"}
        }
    }

    const navigationItems = [
        {name: 'Problems', href: '#problems'},
        {name: 'Features', href: '#features'},
        {name: 'Benefits', href: '#benefits'},
        {name: 'Pricing', href: '#pricing'}
    ]

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        const element = document.querySelector(href) as HTMLElement
        if (element) {
            const offsetTop = element.offsetTop - 80 // Account for sticky nav
            window.scrollTo({top: offsetTop, behavior: 'smooth'})
        }
    }

    const age = (() => {
        // Calculate age based on birthdate 18/05/2005
        const birthDate = new Date(2005, 4, 18) // Month is 0-indexed
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 4 && today.getDate() < 18)) {
            age--
        }
        return age
    })()

    // State for recurrency selection
    const [isYearly, setIsYearly] = useState<boolean>(false)

    return (
        <div ref={containerRef} className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Hero Section */}
            <MotionSection
                className="px-6 py-20 text-center max-w-6xl mx-auto relative overflow-hidden"
                style={{y, opacity}}
            >
                {/* Floating background elements */}
                <MotionDiv
                    className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-red-500/10 to-blue-500/10 rounded-full blur-xl"
                    animate={{
                        y: [-20, 20, -20],
                        x: [-10, 10, -10],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <MotionDiv
                    className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"
                    animate={{
                        y: [20, -20, 20],
                        x: [10, -10, 10],
                        scale: [1.1, 1, 1.1]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                <MotionDiv
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="relative z-10"
                >
                    <MotionDiv variants={staggerItem}>
                        <Badge variant="outline" className="mb-6 border-gray-300 dark:border-gray-700">
                            Your Personal Command Center
                        </Badge>
                    </MotionDiv>

                    <MotionH1
                        variants={staggerItem}
                        className="w-full text-3xl md:text-5xl font-medium tracking-wide mb-6 leading-tight font-heading"
                    >
                        Life OS is your
                        <MotionSpan
                            className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent"
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        > operating system</MotionSpan>
                        <br/>for a cluttered life
                    </MotionH1>

                    <MotionP
                        variants={staggerItem}
                        className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
                    >
                        Built for ambitious students and side-hustlers who juggle classes, internships, and creative
                        projects.<br/>
                        No more app-hopping or sticky notes. Just clarity, focus, and forward momentum in one minimal
                        interface.
                    </MotionP>

                    <MotionDiv
                        variants={staggerItem}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4"
                    >
                        <MotionDiv
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                        >
                            <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-700">
                                Watch Demo
                            </Button>
                        </MotionDiv>
                        <Link
                            href={"/sign-up"}
                        >
                            <MotionDiv
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                            >
                                <Button size="lg"
                                        className="bg-black dark:bg-white text-white dark:text-black lg:hover:bg-gray-800 dark:lg:hover:bg-gray-200 px-8">
                                    Get Started Free
                                    <MotionDiv
                                        className="ml-2"
                                        animate={{x: [0, 4, 0]}}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <ArrowRight className="h-4 w-4"/>
                                    </MotionDiv>
                                </Button>
                            </MotionDiv>
                        </Link>
                    </MotionDiv>

                    <MotionDiv
                        variants={staggerItem}
                        className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500"
                    >
                        <span>Join the growing community of organized achievers</span>
                    </MotionDiv>
                </MotionDiv>
            </MotionSection>

            {/* Problem Section */}
            <MotionSection
                id="problems"
                className="px-6 py-12 bg-gray-50 dark:bg-gray-950"
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                transition={{duration: 0.8}}
                viewport={{once: true, margin: "-100px"}}
            >
                <div className="max-w-5xl mx-auto">
                    {/* Founder Introduction */}
                    <div className="text-center mb-12">
                        <MotionH2
                            className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading"
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            transition={{duration: 0.6}}
                            viewport={{once: true}}
                        >
                            Hi, I&apos;m Maxime, the founder of Life OS
                        </MotionH2>
                        <MotionP
                            className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.2}}
                            viewport={{once: true}}
                        >
                            I&apos;m {age}, studying while building web apps. I was drowning in scattered tools like
                            Notion, Google Keep, Trello, ... I was constantly switching between apps and missing
                            deadlines. So I built Life OS, an app that aims to be the ultimate personal operating
                            system.
                        </MotionP>
                    </div>

                    {/* Before vs After */}
                    <MotionDiv
                        className="grid md:grid-cols-2 gap-8 mb-8"
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        transition={{duration: 0.8, delay: 0.3}}
                        viewport={{once: true}}
                    >
                        {/* Before */}
                        <MotionDiv
                            className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-red-200 dark:border-red-800/30"
                            initial={{opacity: 0, x: -30}}
                            whileInView={{opacity: 1, x: 0}}
                            transition={{duration: 0.6, delay: 0.4}}
                            viewport={{once: true}}
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                <h3 className="text-lg font-medium text-red-700 dark:text-red-400">Before</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>• App-switching every few minutes</li>
                                <li>• Missing important deadlines</li>
                                <li>• Spending more time organizing than working</li>
                                <li>• Constant anxiety about forgetting things</li>
                            </ul>
                        </MotionDiv>

                        {/* After */}
                        <MotionDiv
                            className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-green-200 dark:border-green-800/30"
                            initial={{opacity: 0, x: 30}}
                            whileInView={{opacity: 1, x: 0}}
                            transition={{duration: 0.6, delay: 0.6}}
                            viewport={{once: true}}
                        >
                            <div className="flex items-center mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                <h3 className="text-lg font-medium text-green-700 dark:text-green-400">After Life
                                    OS</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>• Everything in one place</li>
                                <li>• Never miss deadlines with smart reminders</li>
                                <li>• Focus on creating, not managing systems</li>
                                <li>• Calm confidence knowing nothing slips through</li>
                            </ul>
                        </MotionDiv>
                    </MotionDiv>
                </div>
            </MotionSection>

            {/* Solution Section */}
            <MotionSection
                id="features"
                className="px-6 py-8"
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                transition={{duration: 0.8}}
                viewport={{once: true, margin: "-100px"}}
            >
                <div className="max-w-7xl mx-auto">
                    <MotionDiv
                        className="text-center mt-24"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                    >
                        <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">Everything you
                            need. Nothing you don&apos;t.</h2>
                        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Life OS transforms scattered workflows into a seamless life dashboard.
                            Cut context-switching by half and gain calm confidence knowing nothing slips through the
                            cracks.
                        </p>
                    </MotionDiv>

                    {/* Feature Cards - Each taking full screen height */}
                    <FeatureCard
                        icon={<Target className="h-8 w-8 text-blue-500"/>}
                        title="Unified Task Management"
                        description="Stop juggling separate tools for coursework, internship deliverables, and side-project milestones. Life OS brings everything into one organized system where you can see your full workload at a glance."
                        features={[
                            "Organize tasks by project, deadline or imporance",
                            "Set deadlines and get intelligent mail reminders before things slip",
                            "Track progress with visual indicators and different views for different purpose"
                        ]}
                        valueProposition="Save hours and hours per week by eliminating app-switching and gaining instant clarity on all your commitments"
                        delay={0}
                    />

                    <FeatureCard
                        icon={<Sparkles className="h-8 w-8 text-green-500"/>}
                        title="Intelligent Capture"
                        description="Capture ideas, notes, and tasks instantly without breaking your flow. Whether you're in class, at work, or working on your side project, everything gets automatically organized."
                        features={[
                            "Quick capture with easy-to-find buttons and shortcuts",
                            "Markdown text formatting for detailed notes and documentation",
                            "Link notes to specific projects for easy reference"
                        ]}
                        valueProposition="Never lose a brilliant idea again. Capture thoughts 5x faster than traditional note-taking methods"
                        isReversed={true}
                        delay={0}
                    />

                    <FeatureCard
                        icon={<Zap className="h-8 w-8 text-purple-500"/>}
                        title="Minimalist, Distraction-Free Interface"
                        description="Experience a workspace designed for clarity and focus. Life OS features a clean, intuitive interface that puts your priorities front and center: no clutter, no distractions, just the essentials you need to move forward."
                        features={[
                            "Streamlined navigation for instant access to everything",
                            "Adaptive dark/light mode for comfort day or night",
                            "Responsive design that feels natural on any device"
                        ]}
                        valueProposition="Stay in the zone and get more done with an interface that helps you think clearly and act quickly."
                        delay={0}
                    />

                    <FeatureCard
                        icon={<Shield className="h-8 w-8 text-yellow-500"/>}
                        title="Seamless Sync"
                        description="Your data follows you everywhere. Start a task on your laptop in the library, add notes on your phone during lunch, and check progress on your tablet at home. Everything stays perfectly synchronized."
                        features={[
                            "Real-time sync across all devices",
                            "Design optimized for mobile, tablet, and desktop",
                            "Progressive web app for native-like experience on any device"
                        ]}
                        valueProposition="Work from anywhere with confidence - your data is always up-to-date"
                        isReversed={true}
                        delay={0}
                    />

                    <FeatureCard
                        icon={<Users className="h-8 w-8 text-red-500"/>}
                        title="Life Beyond Work"
                        description="Because life isn't just about work. Track movies you want to watch, books you're reading, and experiences you want to have. Balance productivity with personal growth and enjoyment."
                        features={[
                            "Movie and TV show watchlist with ratings and reviews",
                            "Personal goals and habit tracking for holistic life management",
                            "Mood and reflection logging to maintain mental clarity"
                        ]}
                        valueProposition="Achieve better work-life balance by managing both productivity and personal fulfillment in one place"
                        delay={0}
                    />

                    <FeatureCard
                        icon={<CheckCircle className="h-8 w-8 text-indigo-500"/>}
                        title="Private & Secure"
                        description="Your ideas, goals, and personal information stay yours. Built with privacy-first principles so you can focus on creating without worrying about data breaches."
                        features={[
                            "End-to-end encryption for your sensitive data",
                            "GDPR compliant with full data export and deletion rights",
                            "Regular security audits and transparent privacy practices"
                        ]}
                        valueProposition="Sleep soundly knowing your personal data and ambitious plans are protected by bank-grade security"
                        isReversed={true}
                        delay={0}
                    />
                </div>
            </MotionSection>

            {/* Benefits & Transformation Section */}
            <MotionSection
                id="benefits"
                className="px-6 py-16 bg-gray-50 dark:bg-gray-950 min-h-screen flex items-center"
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                transition={{duration: 0.8}}
                viewport={{once: true, margin: "-100px"}}
            >
                <div className="max-w-6xl mx-auto">
                    <MotionDiv
                        className="text-center mb-16"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                    >
                        <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">Transform chaos
                            into clarity</h2>
                        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            See how Life OS shifts you from reactive firefighting to proactive, goal-driven progress.
                        </p>
                    </MotionDiv>

                    <MotionDiv
                        className="grid md:grid-cols-3 gap-8 mb-16"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{once: true, margin: "-50px"}}
                    >
                        <MotionDiv variants={staggerItem} className="text-center">
                            <MotionDiv
                                className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg mb-6"
                                whileHover={{scale: 1.02, y: -5}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            >
                                <h4 className="font-medium font-heading text-red-700 dark:text-red-400 mb-3">Before Life
                                    OS</h4>
                                <MotionUl
                                    className="space-y-2 text-sm text-gray-600 dark:text-gray-400"
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="animate"
                                    viewport={{once: true}}
                                >
                                    {['📱 App-hopping between tools', '📝 Scattered sticky notes', '😰 Missed deadlines', '🧠 Mental overload', '⏰ Wasted time searching'].map((item, index) => (
                                        <MotionLi key={index} variants={staggerItem}>{item}</MotionLi>
                                    ))}
                                </MotionUl>
                            </MotionDiv>
                        </MotionDiv>

                        <MotionDiv variants={staggerItem} className="text-center">
                            <MotionDiv
                                className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-lg mb-6"
                                whileHover={{scale: 1.02, y: -5}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            >
                                <h4 className="font-medium font-heading text-yellow-700 dark:text-yellow-400 mb-3">The
                                    Transition</h4>
                                <MotionDiv
                                    className="text-4xl mb-4 rotate-85 md:rotate-0"
                                    animate={{rotate: [0, 10, 0]}}
                                    transition={{duration: 2, repeat: Infinity, ease: "easeInOut"}}
                                >
                                    →
                                </MotionDiv>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Simple setup, intuitive interface, and immediate organization of your existing
                                    chaos.
                                </p>
                            </MotionDiv>
                        </MotionDiv>

                        <MotionDiv variants={staggerItem} className="text-center">
                            <MotionDiv
                                className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg mb-6"
                                whileHover={{scale: 1.02, y: -5}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            >
                                <h4 className="font-medium font-heading text-green-700 dark:text-green-400 mb-3">After
                                    Life OS</h4>
                                <MotionUl
                                    className="space-y-2 text-sm text-gray-600 dark:text-gray-400"
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="animate"
                                    viewport={{once: true}}
                                >
                                    {['✨ Single source of truth', '🎯 Clear daily priorities', '📈 Consistent progress', '😌 Mental clarity', '🚀 Confident execution'].map((item, index) => (
                                        <MotionLi key={index} variants={staggerItem}>{item}</MotionLi>
                                    ))}
                                </MotionUl>
                            </MotionDiv>
                        </MotionDiv>
                    </MotionDiv>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-xl font-medium tracking-wide mb-6 font-heading">The Life OS
                                Difference</h3>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <div
                                        className="w-12 aspect-square bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium font-heading mb-2">Rational Benefits</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            See every task, note, and deadline in one place. Cut context-switching by
                                            50%
                                            and never lose track of important commitments again.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div
                                        className="w-12 aspect-square bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                        <span
                                            className="text-green-600 dark:text-green-400 text-sm font-medium">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium font-heading mb-2">Emotional Benefits</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Gain calm confidence knowing nothing slips through the cracks.
                                            Feel in control of your ambitious goals and complex schedule.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div
                                        className="w-12 aspect-square bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-4 mt-1">
                                        <span
                                            className="text-purple-600 dark:text-purple-400 text-sm font-medium">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium font-heading mb-2">Social Benefits</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Impress peers and mentors when you deliver reliably and stay ahead of
                                            deadlines.
                                            Build a reputation for being organized and dependable.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8 rounded-xl">
                            <h4 className="font-medium font-heading mb-4 text-center">Weekly Impact</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span
                                        className="text-sm text-gray-600 dark:text-gray-400">Time saved per week</span>
                                    <span className="font-medium">8+ hours</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Stress reduction</span>
                                    <span className="font-medium">Significant</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span
                                        className="text-sm text-gray-600 dark:text-gray-400">Deadline compliance</span>
                                    <span className="font-medium">95%+</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Mental clarity</span>
                                    <span className="font-medium">High</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MotionSection>

            {/* Pricing Section */}
            <MotionSection
                id="pricing"
                className="px-6 py-16"
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                transition={{duration: 0.8}}
                viewport={{once: true, margin: "-100px"}}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <MotionH2
                        className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                    >
                        Choose your operating system
                    </MotionH2>
                    <MotionP
                        className="text-base text-gray-600 dark:text-gray-400 mb-12"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.2}}
                        viewport={{once: true}}
                    >
                        Start free, upgrade when you&apos;re ready to unlock your full potential
                    </MotionP>

                    <MotionDiv
                        className="flex justify-center items-center gap-4 mb-12"
                        initial={{opacity: 0, y: 10}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                        viewport={{once: true}}
                    >
                        <span
                            onClick={() => setIsYearly(false)}
                            className={`${!isYearly && "font-bold"} text-sm text-gray-600 dark:text-gray-400 cursor-pointer`}>
                            Monthly
                        </span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} className="cursor-pointer"/>
                        <span
                            onClick={() => setIsYearly(true)}
                            className={`${isYearly && "font-bold"} text-sm text-gray-600 dark:text-gray-400 cursor-pointer`}>
                            Yearly
                            <Badge className="ml-1 bg-blue-500 lg:hover:bg-blue-600">20% Off</Badge>
                        </span>
                    </MotionDiv>

                    <MotionDiv
                        className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{once: true, margin: "-50px"}}
                    >
                        <PricingCard
                            plan={free}
                            recurrency={isYearly ? 'yearly' : 'monthly'}
                        />

                        {/* Basic Plan */}
                        <PricingCard
                            plan={basic}
                            isPopular={true}
                            recurrency={isYearly ? 'yearly' : 'monthly'}
                        />

                        {/* Pro Plan */}
                        <PricingCard
                            plan={pro}
                            recurrency={isYearly ? 'yearly' : 'monthly'}
                            active={false}
                        />
                    </MotionDiv>

                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-8">
                        No credit card required for Free plan. Cancel paid plans anytime, cancellation at period end.
                    </p>
                </div>
            </MotionSection>

            {/* CTA Section */}
            <MotionSection
                className="px-6 py-20 bg-black dark:bg-white text-white dark:text-black"
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                transition={{duration: 0.8}}
                viewport={{once: true, margin: "-100px"}}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <MotionH2
                        className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                    >
                        Make space for what matters
                    </MotionH2>
                    <MotionP
                        className="text-base opacity-90 mb-8 max-w-2xl mx-auto"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.2}}
                        viewport={{once: true}}
                    >
                        Join ambitious students who&apos;ve transformed chaos into clarity.
                        Your future self will thank you.
                    </MotionP>
                    <MotionDiv
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.4}}
                        viewport={{once: true}}
                    >
                        <Link
                            href={"/sign-up"}
                        >
                            <MotionDiv
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                            >
                                <Button size="lg"
                                        className="bg-white dark:bg-black text-black dark:text-white lg:hover:bg-gray-100 dark:lg:hover:bg-gray-900 px-8">
                                    Get Started Free
                                    <MotionDiv
                                        className="ml-2"
                                        animate={{x: [0, 4, 0]}}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <ArrowRight className="h-4 w-4"/>
                                    </MotionDiv>
                                </Button>
                            </MotionDiv>
                        </Link>
                    </MotionDiv>
                </div>
            </MotionSection>
        </div>
    )
}

function FeatureCard({
                         icon,
                         title,
                         description,
                         features,
                         valueProposition,
                         isReversed = false,
                         delay = 0
                     }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    valueProposition: string;
    isReversed?: boolean;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref as React.RefObject<Element>, {once: true, margin: "-100px"})

    return (
        <MotionDiv
            ref={ref}
            className="min-h-screen flex items-center py-16"
            initial={{opacity: 0}}
            animate={isInView ? {opacity: 1} : {}}
            transition={{duration: 0.8, delay}}
        >
            <div
                className={`grid lg:grid-cols-2 gap-16 items-center w-full ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
                <MotionDiv
                    className={`space-y-8 ${isReversed ? 'lg:order-2' : ''}`}
                    initial={{opacity: 0, x: isReversed ? 50 : -50}}
                    animate={isInView ? {opacity: 1, x: 0} : {}}
                    transition={{duration: 0.8, delay: delay + 0.2}}
                >
                    <div className="flex items-center mb-8">
                        <MotionDiv
                            className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center mr-6"
                            whileHover={{
                                scale: 1.1,
                                rotate: 5,
                                transition: {type: "spring", stiffness: 400, damping: 17}
                            }}
                        >
                            {icon}
                        </MotionDiv>
                        <h3 className="text-3xl lg:text-4xl font-medium font-heading">{title}</h3>
                    </div>

                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {description}
                    </p>

                    {/* Value Proposition Highlight */}
                    <MotionDiv
                        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-xl border-l-4 border-blue-500"
                        initial={{opacity: 0, scale: 0.95}}
                        animate={isInView ? {opacity: 1, scale: 1} : {}}
                        transition={{duration: 0.6, delay: delay + 0.4}}
                        whileHover={{scale: 1.02}}
                    >
                        <div className="flex items-center">
                            <div
                                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-white"/>
                            </div>
                            <div>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">
                                    {valueProposition}
                                </p>
                            </div>
                        </div>
                    </MotionDiv>

                    <MotionUl
                        className="space-y-4 text-gray-600 dark:text-gray-400"
                        variants={{
                            hidden: {},
                            show: {
                                transition: {
                                    staggerChildren: 0.1,
                                    delayChildren: delay + 0.6
                                }
                            }
                        }}
                        initial="hidden"
                        animate={isInView ? "show" : "hidden"}
                    >
                        {features.map((feature, index) => (
                            <MotionLi
                                key={index}
                                className="flex items-start text-lg"
                                variants={{
                                    hidden: {opacity: 0, x: -20},
                                    show: {
                                        opacity: 1,
                                        x: 0,
                                        transition: {duration: 0.5}
                                    }
                                }}
                            >
                                <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0"/>
                                <span>{feature}</span>
                            </MotionLi>
                        ))}
                    </MotionUl>
                </MotionDiv>

                <MotionDiv
                    className={`relative ${isReversed ? 'lg:order-1' : ''}`}
                    initial={{opacity: 0, x: isReversed ? -50 : 50}}
                    animate={isInView ? {opacity: 1, x: 0} : {}}
                    transition={{duration: 0.8, delay: delay + 0.4}}
                    whileHover={{scale: 1.02}}
                >
                    {/* Background gradient */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl"/>

                    {/* Content */}
                    <div
                        className="relative bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-2xl p-12 min-h-[500px] flex flex-col items-center justify-center border border-gray-200/50 dark:border-gray-700/50">
                        <MotionDiv
                            className="text-center text-gray-500 dark:text-gray-400"
                            animate={{
                                y: [-10, 10, -10],
                                rotate: [-3, 3, -3]
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div
                                className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                                <div className="w-16 h-16 text-4xl">
                                    {icon}
                                </div>
                            </div>
                            <p className="text-xl font-medium">{title} Interface</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Designed for efficiency and clarity
                            </p>
                        </MotionDiv>

                        {/* Floating elements for visual interest */}
                        <MotionDiv
                            className="absolute top-8 right-8 w-4 h-4 bg-blue-400 rounded-full opacity-60"
                            animate={{
                                y: [-20, 20, -20],
                                x: [-10, 10, -10],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <MotionDiv
                            className="absolute bottom-8 left-8 w-6 h-6 bg-purple-400 rounded-full opacity-40"
                            animate={{
                                y: [20, -20, 20],
                                x: [10, -10, 10],
                                scale: [1.2, 1, 1.2]
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </MotionDiv>
            </div>
        </MotionDiv>
    )
}
