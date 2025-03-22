"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface RippleProps {
  color?: string
  duration?: number
  className?: string
}

export const Ripple: React.FC<RippleProps> = ({ color = "rgba(255, 255, 255, 0.35)", duration = 500, className }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; size: number; id: number }>>([])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const size = Math.max(rect.width, rect.height) * 2

      const newRipple = {
        x,
        y,
        size,
        id: Date.now(),
      }

      setRipples((prevRipples) => [...prevRipples, newRipple])

      setTimeout(() => {
        setRipples((prevRipples) => prevRipples.filter((ripple) => ripple.id !== newRipple.id))
      }, duration)
    }

    document.querySelectorAll('[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]').forEach((element) => {
      element.addEventListener("mousedown", handleClick as EventListener)
    })

    return () => {
      document.querySelectorAll('[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]').forEach((element) => {
        element.removeEventListener("mousedown", handleClick as EventListener)
      })
    }
  }, [duration])

  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={cn("absolute block rounded-full pointer-events-none opacity-100 animate-ripple", className)}
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </>
  )
}

