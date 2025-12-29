import React from 'react'
import { CheckCircle, Shield, Target, Users, Zap } from "lucide-react"
import { HeroSection } from "../../components/big/landing-page/hero-section"
import { FeatureCard } from "../../components/big/landing-page/feature-card"
import { PricingSection } from "../../components/big/landing-page/pricing-section"
import { ProblemSection, BenefitsSection, CTASection } from "../../components/big/landing-page/animated-sections"

// Calculate age at build/request time (server-side)
function getAge() {
    const birthDate = new Date(2005, 4, 18) // Month is 0-indexed
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 4 && today.getDate() < 18)) {
        age--
    }
    return age
}

// Feature data defined server-side
const features = [
    {
        icon: <Target className="h-8 w-8 text-blue-500" />,
        title: "Unified Task Management",
        description: "Stop juggling separate tools for coursework, internship deliverables, and side-project milestones. Life OS brings everything into one organized system where you can see your full workload at a glance.",
        features: [
            "Organize tasks by project, deadline or importance",
            "Set deadlines and get intelligent mail reminders before things slip",
            "Track progress with visual indicators and different views for different purpose"
        ],
        valueProposition: "Save hours and hours per week by eliminating app-switching and gaining instant clarity on all your commitments",
        isReversed: false
    },
    {
        icon: <Zap className="h-8 w-8 text-purple-500" />,
        title: "Minimalist, Distraction-Free Interface",
        description: "Experience a workspace designed for clarity and focus. Life OS features a clean, intuitive interface that puts your priorities front and center: no clutter, no distractions, just the essentials you need to move forward.",
        features: [
            "Streamlined navigation for instant access to everything",
            "Adaptive dark/light mode for comfort day or night",
            "Responsive design that feels natural on any device"
        ],
        valueProposition: "Stay in the zone and get more done with an interface that helps you think clearly and act quickly.",
        isReversed: true
    },
    {
        icon: <Shield className="h-8 w-8 text-yellow-500" />,
        title: "Seamless Sync",
        description: "Your data follows you everywhere. Start a task on your laptop in the library, add notes on your phone during lunch, and check progress on your tablet at home. Everything stays perfectly synchronized.",
        features: [
            "Real-time sync across all devices",
            "Design optimized for mobile, tablet, and desktop",
            "Progressive web app for native-like experience on any device"
        ],
        valueProposition: "Work from anywhere with confidence - your data is always up-to-date",
        isReversed: false
    },
    {
        icon: <Users className="h-8 w-8 text-red-500" />,
        title: "Life Beyond Work",
        description: "Because life isn't just about work. Track movies you want to watch, books you're reading, and experiences you want to have. Balance productivity with personal growth and enjoyment.",
        features: [
            "Movie and TV show watchlist with ratings and reviews",
            "Personal goals and habit tracking for holistic life management",
            "Mood and reflection logging to maintain mental clarity"
        ],
        valueProposition: "Achieve better work-life balance by managing both productivity and personal fulfillment in one place",
        isReversed: true
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-indigo-500" />,
        title: "Private & Secure",
        description: "Your ideas, goals, and personal information stay yours. Built with privacy-first principles so you can focus on creating without worrying about data breaches.",
        features: [
            "End-to-end encryption for your sensitive data",
            "GDPR compliant with full data export and deletion rights",
            "Regular security audits and transparent privacy practices"
        ],
        valueProposition: "Sleep soundly knowing your personal data and ambitious plans are protected by bank-grade security",
        isReversed: false
    }
]

export default function LandingPage() {
    const age = getAge()

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Hero Section - Client Component for scroll animations */}
            <HeroSection />

            {/* Problem Section - Client Component for animations */}
            <ProblemSection age={age} />

            {/* Solution/Features Section */}
            <section id="features" className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mt-24">
                        <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">
                            Everything you need. Nothing you don&apos;t.
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Life OS transforms scattered workflows into a seamless life dashboard.
                            Cut context-switching by half and gain calm confidence knowing nothing slips through the cracks.
                        </p>
                    </div>

                    {/* Feature Cards - Client Components for animations */}
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            features={feature.features}
                            valueProposition={feature.valueProposition}
                            isReversed={feature.isReversed}
                            delay={0}
                        />
                    ))}
                </div>
            </section>

            {/* Benefits Section - Client Component for animations */}
            <BenefitsSection />

            {/* Pricing Section - Client Component for state */}
            <PricingSection />

            {/* CTA Section - Client Component for animations */}
            <CTASection />
        </div>
    )
}
