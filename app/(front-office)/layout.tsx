"use client";

import Logo from "@/components/big/logo";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter();
    const pathname = usePathname();

    const onSharedPage = pathname.startsWith('/shared');

    const navigationItems = [
        { name: 'Problem', href: '#problem' },
        { name: 'Features', href: '#features' },
        { name: 'Benefits', href: '#benefits' },
        { name: 'Pricing', href: '#pricing' }
    ]

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        if (window.location.pathname !== "/") {
            router.push("/" + href)
            return
        }
        const element = document.querySelector(href) as HTMLElement
        if (element) {
            const offsetTop = element.offsetTop - 80
            window.scrollTo({ top: offsetTop, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-white/80 dark:bg-black/80 sticky top-0 z-50">
                <div className="flex items-center space-x-2 hover:scale-[1.02] transition-transform">
                    <Logo size={48} title />
                </div>

                {/* Desktop Navigation Links */}
                {!onSharedPage && (
                    <div className="hidden md:flex items-center space-x-8">
                        {navigationItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors relative group"
                                onClick={(e) => handleNavClick(e, item.href)}
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </a>
                        ))}
                    </div>
                )}

                {/* Desktop CTA Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                    <Link href="/login" className="text-sm hover:underline transition-all">
                        Sign In
                    </Link>
                    <Link href="/sign-up">
                        <Button size="sm" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col items-center justify-center h-full space-y-8">
                        <div className="flex flex-col items-center space-y-6">
                            {navigationItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-2xl font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    onClick={(e) => {
                                        handleNavClick(e, item.href)
                                        setIsMobileMenuOpen(false)
                                    }}
                                >
                                    {item.name}
                                </a>
                            ))}
                        </div>

                        <div className="flex flex-col items-center space-y-4">
                            <Link
                                href="/login"
                                className="text-lg hover:underline"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button
                                    size="lg"
                                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                >
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {children}

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0 hover:scale-[1.02] transition-transform">
                        <Logo size={32} title />
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        {['Privacy', 'Terms', 'Contact'].map((link) => (
                            <Link
                                key={link}
                                href={`/${link.toLowerCase()}`}
                                className="hover:underline hover:-translate-y-0.5 transition-all"
                            >
                                {link}
                            </Link>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    )
}
