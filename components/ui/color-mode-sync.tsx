"use client"

import { useEffect } from "react"

export default function ColorModeSync() {
    useEffect(() => {
        const el = document.documentElement
        if (!el) return

        const apply = () => {
            try {
                const isDark = el.classList.contains('dark')
                el.setAttribute('data-color-mode', isDark ? 'dark' : 'light')
            } catch (e) {
                // noop
            }
        }

        // initial apply
        apply()

        // Observe changes to class attribute on documentElement
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'className')) {
                    apply()
                }
            }
        })

        obs.observe(el, { attributes: true, attributeFilter: ['class', 'className'] })

        return () => obs.disconnect()
    }, [])

    return null
}
