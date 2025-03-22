"use client"

import { useState } from "react"
import { createClientSupabaseClient, type Metric } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const fetchMetrics = async (customerId?: string) => {
    setIsLoading(true)
    setIsError(false)

    try {
      let query = supabase.from("metrics").select("*")

      if (customerId) {
        query = query.eq("customer_id", customerId)
      }

      const { data, error } = await query
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .order("week", { ascending: true })

      if (error) throw error

      setMetrics(data as Metric[])
    } catch (error: any) {
      console.error("Error fetching metrics:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load metrics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMetric = async (id: string): Promise<Metric | null> => {
    try {
      const { data, error } = await supabase.from("metrics").select("*").eq("id", id).single()

      if (error) throw error

      return data as Metric
    } catch (error: any) {
      console.error("Error fetching metric:", error)
      toast({
        title: "Error",
        description: "Failed to load metric details.",
        variant: "destructive",
      })
      return null
    }
  }

  const createMetric = async (
    metricData: Omit<Metric, "id" | "created_at" | "updated_at" | "ctr" | "cpc" | "cpa">,
  ): Promise<Metric | null> => {
    try {
      // Calculate derived metrics
      const ctr = metricData.impressions > 0 ? (metricData.clicks / metricData.impressions) * 100 : 0
      const cpc = metricData.clicks > 0 ? metricData.cost / metricData.clicks : 0
      const cpa = metricData.conversions > 0 ? metricData.cost / metricData.conversions : 0

      const newMetric = {
        ...metricData,
        ctr,
        cpc,
        cpa,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("metrics").insert([newMetric]).select()

      if (error) throw error

      const createdMetric = data[0] as Metric
      setMetrics((prev) => [...prev, createdMetric])

      toast({
        title: "Metrics added",
        description: `Metrics for ${metricData.year}-${metricData.month}-${metricData.week} have been added successfully.`,
      })

      return createdMetric
    } catch (error: any) {
      console.error("Error creating metric:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add metrics.",
        variant: "destructive",
      })
      return null
    }
  }

  const updateMetric = async (id: string, metricData: Partial<Metric>): Promise<Metric | null> => {
    try {
      const updates: any = {
        ...metricData,
        updated_at: new Date().toISOString(),
      }

      // Recalculate derived metrics if primary metrics are updated
      if (
        metricData.impressions !== undefined ||
        metricData.clicks !== undefined ||
        metricData.conversions !== undefined ||
        metricData.cost !== undefined
      ) {
        // Get current metric data
        const { data: currentData, error: fetchError } = await supabase
          .from("metrics")
          .select("*")
          .eq("id", id)
          .single()

        if (fetchError) throw fetchError

        const current = currentData as Metric

        // Use new values or fall back to current values
        const impressions = metricData.impressions ?? current.impressions
        const clicks = metricData.clicks ?? current.clicks
        const conversions = metricData.conversions ?? current.conversions
        const cost = metricData.cost ?? current.cost

        // Calculate derived metrics
        updates.ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
        updates.cpc = clicks > 0 ? cost / clicks : 0
        updates.cpa = conversions > 0 ? cost / conversions : 0
      }

      const { data, error } = await supabase.from("metrics").update(updates).eq("id", id).select()

      if (error) throw error

      const updatedMetric = data[0] as Metric
      setMetrics((prev) => prev.map((metric) => (metric.id === id ? updatedMetric : metric)))

      toast({
        title: "Metrics updated",
        description: `Metrics have been updated successfully.`,
      })

      return updatedMetric
    } catch (error: any) {
      console.error("Error updating metric:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update metrics.",
        variant: "destructive",
      })
      return null
    }
  }

  const deleteMetric = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("metrics").delete().eq("id", id)

      if (error) throw error

      setMetrics((prev) => prev.filter((metric) => metric.id !== id))

      toast({
        title: "Metrics deleted",
        description: "The metrics have been successfully deleted.",
      })

      return true
    } catch (error: any) {
      console.error("Error deleting metric:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete metrics.",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    metrics,
    isLoading,
    isError,
    fetchMetrics,
    getMetric,
    createMetric,
    updateMetric,
    deleteMetric,
  }
}

