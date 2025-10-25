"use client";

import {MotionA, MotionButton, MotionDiv, MotionFooter} from "@/lib/services/motion";
import Logo from "@/components/big/logo";
import React, {useRef, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Menu, X} from "lucide-react";

export default function FrontOfficeLayout({children}: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

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
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    }

    const navigationItems = [
        { name: 'Problems', href: '#problems' },
        { name: 'Features', href: '#features' },
        { name: 'Benefits', href: '#benefits' },
        { name: 'Pricing', href: '#pricing' }
    ]

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        const element = document.querySelector(href) as HTMLElement
        if (element) {
            const offsetTop = element.offsetTop - 80 // Account for sticky nav
            window.scrollTo({ top: offsetTop, behavior: 'smooth' })
        }
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <nav
                className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-white/80 dark:bg-black/80 sticky top-0 z-50">
                <MotionDiv
                    className="flex items-center space-x-2"
                    whileHover={{scale: 1.02}}
                    transition={{type: "spring", stiffness: 400, damping: 17}}
                >
                    <Logo size={48} title/>
                </MotionDiv>

                {/* Desktop Navigation Links */}
                <MotionDiv
                    className="hidden md:flex items-center space-x-8"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    {navigationItems.map((item) => (
                        <MotionA
                            key={item.name}
                            href={item.href}
                            variants={staggerItem}
                            className="text-sm text-gray-600 dark:text-gray-400 lg:hover:text-black dark:lg:hover:text-white transition-colors relative group"
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item.href)}
                            whileHover={{y: -2}}
                            transition={{type: "spring", stiffness: 400, damping: 17}}
                        >
                            {item.name}
                            <MotionDiv
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black dark:bg-white"
                                initial={{scaleX: 0}}
                                whileHover={{scaleX: 1}}
                                transition={{duration: 0.2}}
                            />
                        </MotionA>
                    ))}
                </MotionDiv>

                {/* Desktop CTA Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                    <MotionDiv whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                        <Link href="/login" className="text-sm lg:hover:underline">Sign In</Link>
                    </MotionDiv>
                    <MotionDiv whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                        <Link href="/sign-up">
                            <Button size="sm"
                                    className="bg-black dark:bg-white text-white dark:text-black lg:hover:bg-gray-800 dark:lg:hover:bg-gray-200">
                                Get Started
                            </Button>
                        </Link>
                    </MotionDiv>
                </div>

                {/* Mobile Menu Button */}
                <MotionButton
                    className="md:hidden p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                >
                    <MotionDiv
                        animate={{rotate: isMobileMenuOpen ? 180 : 0}}
                        transition={{duration: 0.3}}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
                    </MotionDiv>
                </MotionButton>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <MotionDiv
                    className="md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-sm"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    transition={{duration: 0.3}}
                >
                    <div className="flex flex-col items-center justify-center h-full space-y-8">
                        <MotionDiv
                            className="flex flex-col items-center space-y-6"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {navigationItems.map((item) => (
                                <MotionA
                                    key={item.name}
                                    href={item.href}
                                    variants={staggerItem}
                                    className="text-2xl font-medium text-gray-600 dark:text-gray-400 lg:hover:text-black dark:lg:hover:text-white transition-colors"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                        handleNavClick(e, item.href)
                                        setIsMobileMenuOpen(false)
                                    }}
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                >
                                    {item.name}
                                </MotionA>
                            ))}
                        </MotionDiv>

                        <MotionDiv
                            className="flex flex-col items-center space-y-4"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            <MotionDiv variants={staggerItem}>
                                <Link
                                    href="/login"
                                    className="text-lg lg:hover:underline"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            </MotionDiv>
                            <MotionDiv variants={staggerItem}>
                                <Button
                                    size="lg"
                                    className="bg-black dark:bg-white text-white dark:text-black lg:hover:bg-gray-800 dark:lg:hover:bg-gray-200"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Button>
                            </MotionDiv>
                        </MotionDiv>
                    </div>
                </MotionDiv>
            )}
            {children}

            {/* Footer */}
            <MotionFooter
                className="px-6 py-8 border-t border-gray-200 dark:border-gray-800"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <MotionDiv
                    className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center"
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    <MotionDiv
                        className="flex items-center space-x-2 mb-4 md:mb-0"
                        variants={staggerItem}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Logo size={32} title />
                    </MotionDiv>
                    <MotionDiv
                        className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {['Privacy', 'Terms', 'Contact'].map((link) => (
                            <MotionDiv
                                key={link}
                                variants={staggerItem}
                            >
                                <MotionDiv
                                    whileHover={{ y: -2 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <Link href={`/${link.toLowerCase()}`} className="lg:hover:underline">
                                        {link}
                                    </Link>
                                </MotionDiv>
                            </MotionDiv>
                        ))}
                    </MotionDiv>
                </MotionDiv>
            </MotionFooter>
        </div>
    )
}