"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient, type Customer } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const fetchCustomers = async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const { data, error } = await supabase.from("customers").select("*").order("name")

      if (error) throw error

      setCustomers(data as Customer[])
    } catch (error: any) {
      console.error("Error fetching customers:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCustomer = async (id: string): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

      if (error) throw error

      return data as Customer
    } catch (error: any) {
      console.error("Error fetching customer:", error)
      toast({
        title: "Error",
        description: "Failed to load customer details.",
        variant: "destructive",
      })
      return null
    }
  }

  const createCustomer = async (
    customerData: Omit<Customer, "id" | "created_at" | "updated_at" | "date_added">,
  ): Promise<Customer | null> => {
    try {
      const newCustomer = {
        ...customerData,
        date_added: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("customers").insert([newCustomer]).select()

      if (error) throw error

      const createdCustomer = data[0] as Customer
      setCustomers((prev) => [...prev, createdCustomer])

      toast({
        title: "Customer created",
        description: `${customerData.name} has been added successfully.`,
      })

      return createdCustomer
    } catch (error: any) {
      console.error("Error creating customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create customer.",
        variant: "destructive",
      })
      return null
    }
  }

  const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
    try {
      const updates = {
        ...customerData,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select()

      if (error) throw error

      const updatedCustomer = data[0] as Customer
      setCustomers((prev) => prev.map((customer) => (customer.id === id ? updatedCustomer : customer)))

      toast({
        title: "Customer updated",
        description: `Customer has been updated successfully.`,
      })

      return updatedCustomer
    } catch (error: any) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update customer.",
        variant: "destructive",
      })
      return null
    }
  }

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id)

      if (error) throw error

      setCustomers((prev) => prev.filter((customer) => customer.id !== id))

      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      })

      return true
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer.",
        variant: "destructive",
      })
      return false
    }
  }

  // Load customers on initial mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  return {
    customers,
    isLoading,
    isError,
    fetchCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}

