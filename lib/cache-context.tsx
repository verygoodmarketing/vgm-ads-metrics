"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import type { Customer, Metric } from "@/lib/supabase"

interface CacheContextType {
  customers: Customer[] | null
  setCustomers: (customers: Customer[]) => void
  metrics: Record<string, Metric[]>
  setMetricsForCustomer: (customerId: string, metrics: Metric[]) => void
  clearCache: () => void
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

export function CacheProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({})

  const setMetricsForCustomer = (customerId: string, customerMetrics: Metric[]) => {
    setMetrics((prev) => ({
      ...prev,
      [customerId]: customerMetrics,
    }))
  }

  const clearCache = () => {
    setCustomers(null)
    setMetrics({})
  }

  return (
    <CacheContext.Provider
      value={{
        customers,
        setCustomers,
        metrics,
        setMetricsForCustomer,
        clearCache,
      }}
    >
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (context === undefined) {
    throw new Error("useCache must be used within a CacheProvider")
  }
  return context
}
