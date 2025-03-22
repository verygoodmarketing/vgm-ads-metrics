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

// Mock metrics data - in a real app, this would come from an API or database
const mockMetricsData = [
  { week: "Week 1", impressions: 12500, clicks: 450, conversions: 25, cost: 1200, ctr: 3.6, cpc: 2.67, cpa: 48 },
  { week: "Week 2", impressions: 13200, clicks: 520, conversions: 32, cost: 1350, ctr: 3.9, cpc: 2.6, cpa: 42.19 },
  { week: "Week 3", impressions: 14800, clicks: 580, conversions: 38, cost: 1480, ctr: 3.92, cpc: 2.55, cpa: 38.95 },
  { week: "Week 4", impressions: 15300, clicks: 610, conversions: 42, cost: 1550, ctr: 3.99, cpc: 2.54, cpa: 36.9 },
]

// Mock customer data
const mockCustomers = [
  { id: "1", name: "Acme Inc." },
  { id: "2", name: "Globex Corporation" },
  { id: "3", name: "Initech" },
  { id: "4", name: "Umbrella Corp" },
]

export default function EditMetricsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  // Use state for loading to prevent hydration mismatch
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    week: "",
    impressions: "",
    clicks: "",
    conversions: "",
    cost: "",
  })

  // Get customer and metric IDs from params
  const customerId = params.id as string
  const metricId = Number.parseInt(params.metricId as string)

  // Get customer data
  const [customer, setCustomer] = useState({ id: "0", name: "Loading..." })

  useEffect(() => {
    // Find the customer
    const foundCustomer = mockCustomers.find((c) => c.id === customerId) || { id: "0", name: "Unknown Customer" }
    setCustomer(foundCustomer)

    // Load metric data
    if (metricId >= 0 && metricId < mockMetricsData.length) {
      const metric = mockMetricsData[metricId]
      setFormData({
        week: metric.week,
        impressions: metric.impressions.toString(),
        clicks: metric.clicks.toString(),
        conversions: metric.conversions.toString(),
        cost: metric.cost.toString(),
      })
    } else {
      // Invalid metric ID, redirect back
      router.push(`/customers/${customerId}`)
    }

    setIsLoading(false)
  }, [metricId, customerId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleWeekChange = (value: string) => {
    setFormData((prev) => ({ ...prev, week: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Metrics updated",
        description: `Metrics for ${customer.name} - ${formData.week} have been updated successfully.`,
      })
      setIsSubmitting(false)
      router.push(`/customers/${customerId}?tab=metrics-history`)
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/customers/${customerId}?tab=metrics-history`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Metrics for {customer.name}</h2>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google Ads Metrics</CardTitle>
          <CardDescription>Update metrics data for {customer.name}.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="week">Week</Label>
              <Select value={formData.week} onValueChange={handleWeekChange}>
                <SelectTrigger id="week">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Week 1">Week 1</SelectItem>
                  <SelectItem value="Week 2">Week 2</SelectItem>
                  <SelectItem value="Week 3">Week 3</SelectItem>
                  <SelectItem value="Week 4">Week 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impressions">Impressions</Label>
              <Input
                id="impressions"
                name="impressions"
                type="number"
                value={formData.impressions}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clicks">Clicks</Label>
              <Input id="clicks" name="clicks" type="number" value={formData.clicks} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversions">Conversions</Label>
              <Input
                id="conversions"
                name="conversions"
                type="number"
                value={formData.conversions}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input id="cost" name="cost" type="number" value={formData.cost} onChange={handleChange} required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/customers/${customerId}?tab=metrics-history`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Metrics"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

