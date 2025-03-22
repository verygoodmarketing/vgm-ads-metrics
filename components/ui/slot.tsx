"use client"

import * as React from "react"

type SlotProps = {
  children?: React.ReactNode
}

// A simplified version of Radix UI's Slot component
// It renders the child component and passes all props to it
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & SlotProps>(
  ({ children, ...props }, ref) => {
    if (!children || !React.isValidElement(children)) {
      return null
    }

    return React.cloneElement(children, {
      ...props,
      ref: ref ? mergeRefs([ref, (children as any).ref]) : (children as any).ref,
    })
  },
)
Slot.displayName = "Slot"

// Helper function to merge refs
function mergeRefs(refs: React.Ref<any>[]) {
  return (value: any) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<any>).current = value
      }
    })
  }
}

