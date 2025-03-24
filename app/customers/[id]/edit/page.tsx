"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient, type Customer } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const customerId = params.id as string
  const supabase = createClientSupabaseClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive",
  })

  // Fetch customer data from Supabase
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        router.push("/customers")
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single()

        if (error) {
          console.error("Error fetching customer:", error)
          toast({
            title: "Error",
            description: "Failed to load customer data. Redirecting back to customers list.",
            variant: "destructive",
          })
          router.push("/customers")
          return
        }

        if (!data) {
          toast({
            title: "Customer not found",
            description: "The requested customer could not be found.",
            variant: "destructive",
          })
          router.push("/customers")
          return
        }

        // Set form data from customer data
        setFormData({
          name: data.name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone || "",
          status: data.status,
        })
      } catch (error) {
        console.error("Error in customer fetch:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
        router.push("/customers")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchCustomer()
    }
  }, [customerId, router, supabase, toast, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as "active" | "inactive" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update customer in Supabase
      const { error } = await supabase
        .from("customers")
        .update({
          name: formData.name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)

      if (error) {
        throw error
      }

      toast({
        title: "Customer updated",
        description: `${formData.name} has been updated successfully.`,
      })
      
      router.push("/customers")
    } catch (error: any) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading customer data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Customer</h2>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Update customer information.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Person</Label>
              <Input
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/customers")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Customer"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

