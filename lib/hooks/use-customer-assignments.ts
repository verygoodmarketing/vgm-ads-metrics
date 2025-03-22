"use client"

import { useState } from "react"
import { createClientSupabaseClient, type Customer } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function useCustomerAssignments() {
  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const fetchAssignedCustomers = async (userId: string) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.from("customers").select("*").eq("user_id", userId).order("name")

      if (error) throw error

      setAssignedCustomers(data as Customer[])
    } catch (error: any) {
      console.error("Error fetching assigned customers:", error)
      toast({
        title: "Error",
        description: "Failed to load assigned customers.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const assignCustomer = async (customerId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("customers").update({ user_id: userId }).eq("id", customerId)

      if (error) throw error

      toast({
        title: "Customer assigned",
        description: "Customer has been assigned successfully.",
      })

      return true
    } catch (error: any) {
      console.error("Error assigning customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign customer.",
        variant: "destructive",
      })
      return false
    }
  }

  const unassignCustomer = async (customerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("customers").update({ user_id: null }).eq("id", customerId)

      if (error) throw error

      toast({
        title: "Customer unassigned",
        description: "Customer has been unassigned successfully.",
      })

      return true
    } catch (error: any) {
      console.error("Error unassigning customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to unassign customer.",
        variant: "destructive",
      })
      return false
    }
  }

  const getAvailableCustomers = async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase.from("customers").select("*").is("user_id", null).order("name")

      if (error) throw error

      return data as Customer[]
    } catch (error: any) {
      console.error("Error fetching available customers:", error)
      toast({
        title: "Error",
        description: "Failed to load available customers.",
        variant: "destructive",
      })
      return []
    }
  }

  return {
    assignedCustomers,
    isLoading,
    fetchAssignedCustomers,
    assignCustomer,
    unassignCustomer,
    getAvailableCustomers,
  }
}

