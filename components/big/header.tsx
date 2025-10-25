"use client"

import DarkModeToggle from "@/components/big/darkMode/dark-mode-toggle"
import Meteo from "@/components/big/meteo"
import Menu from "@/components/big/menu"
import DateDisplay from "@/components/big/date"
import Time from "@/components/big/time"
import {useScrollDirection} from "@/hooks/use-scroll-direction"
import {cn} from "@/lib/utils"
import {useState} from "react"
import {usePathname} from "next/navigation"
import {DarkModeCookie} from "@/lib/flags"
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {useNoteModal} from "@/contexts/modal-commands-context";


export default function Header(
    {
        darkModeCookie
    }: {
        darkModeCookie: DarkModeCookie
    }
) {
    const {isVisible} = useScrollDirection()
    const [isHovering, setIsHovering] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const noteModal = useNoteModal()

    return (
        <header
            className={cn(
                `fixed z-50 bottom-4 ${(isHovering || isOpen) && 'lg:mb-2'} flex items-center justify-center w-full transition-all duration-300 pointer-events-none`,
                isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0",
            )}
        >
            <div
                className="relative w-fit max-w-[90%] p-1 xl:p-2 px-2 xl:px-4 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-between border border-gray-200 dark:border-gray-800 transition-all duration-300 group/Header pointer-events-auto"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* DarkModeToggle with smooth animation */}
                <div
                    className={
                        `overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center w-fit max-w-[24px] mr-2 lg:w-0 lg:max-w-0 lg:opacity-0 lg:m-0 ${isHovering || isOpen ? 'lg:w-fit lg:max-w-[24px] lg:opacity-100 lg:mr-2 xl:mr-4' : ''}`
                    }
                >
                    <DarkModeToggle className="transition-transform duration-300" initialCookie={darkModeCookie}/>
                </div>

                {/* Center content */}
                <div
                    className={`flex items-center justify-center gap-1 xl:gap-2 group/Time duration-300 h-6 ${isHovering || isOpen ? 'lg:h-12' : ''}`}>
                    <Meteo/>
                    <div>
                        <Time
                            className={"xl:text-base duration-300 xl:transform lg:group-hover/Time:translate-y-0 xl:translate-y-3"}
                        />
                        <DateDisplay
                            className={"text-xs xl:text-sm duration-300 xl:transform lg:group-hover/Time:opacity-100 lg:group-hover/Time:translate-y-0 xl:opacity-0 xl:-translate-y-2"}
                        />
                    </div>
                </div>

                {
                    pathname === "/my/notes" && (
                        <div
                            className="ml-2 lg:ml-0"
                            onClick={() => {
                                setIsOpen(false)
                                setIsHovering(false)
                            }}>
                            <Button
                                variant="outline"
                                size="icon"
                                className={
                                    "whitespace-nowrap transition-transform duration-300 border-none"
                                }
                                onClick={() => noteModal.openModal()}
                            >
                                <Plus size={24}/>
                            </Button>
                        </div>
                    )
                }

                <div
                    className={
                        `overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center w-fit max-w-[40px] ml-2 lg:w-0 lg:max-w-0 lg:opacity-0 lg:m-0 ${isHovering || isOpen ? 'lg:w-fit lg:max-w-[40px] lg:opacity-100 lg:ml-2 xl:ml-4' : ''}`
                    }
                >
                    <Menu/>
                </div>
            </div>
        </header>
    )
}