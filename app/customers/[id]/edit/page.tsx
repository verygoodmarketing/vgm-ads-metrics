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

// Mock customer data
const mockCustomers = [
  {
    id: "1",
    name: "Acme Inc.",
    contactName: "John Doe",
    email: "john@acme.com",
    phone: "555-123-4567",
    status: "active",
    dateAdded: "2023-01-15",
  },
  {
    id: "2",
    name: "Globex Corporation",
    contactName: "Jane Smith",
    email: "jane@globex.com",
    phone: "555-987-6543",
    status: "active",
    dateAdded: "2023-02-20",
  },
  {
    id: "3",
    name: "Initech",
    contactName: "Michael Bolton",
    email: "michael@initech.com",
    phone: "555-456-7890",
    status: "inactive",
    dateAdded: "2023-03-10",
  },
  {
    id: "4",
    name: "Umbrella Corp",
    contactName: "Alice Johnson",
    email: "alice@umbrella.com",
    phone: "555-789-0123",
    status: "active",
    dateAdded: "2023-04-05",
  },
]

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const customerId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    status: "",
  })

  useEffect(() => {
    const customer = mockCustomers.find((c) => c.id === customerId)
    if (customer) {
      setFormData({
        name: customer.name,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
      })
    } else {
      router.push("/customers")
    }
  }, [customerId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Customer updated",
        description: `${formData.name} has been updated successfully.`,
      })
      setIsSubmitting(false)
      router.push("/customers")
    }, 1000)
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
              <Label htmlFor="contactName">Contact Person</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
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

