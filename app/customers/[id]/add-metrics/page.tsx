"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

// Mock customer data
const mockCustomers = [
  { id: "1", name: "Acme Inc." },
  { id: "2", name: "Globex Corporation" },
  { id: "3", name: "Initech" },
  { id: "4", name: "Umbrella Corp" },
]

export default function AddMetricsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const customerId = params.id as string
  const customer = mockCustomers.find((c) => c.id === customerId) || { id: "0", name: "Unknown Customer" }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    week: "Week 1",
    impressions: "",
    clicks: "",
    conversions: "",
    cost: "",
    topKeywords: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        title: "Metrics added",
        description: `Metrics for ${customer.name} - ${formData.week} have been added successfully.`,
      })
      setIsSubmitting(false)
      router.push(`/customers/${customerId}`)
    }, 1000)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/customers/${customerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Add Metrics for {customer.name}</h2>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google Ads Metrics</CardTitle>
          <CardDescription>Add weekly Google Ads metrics for {customer.name}.</CardDescription>
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
                placeholder="10000"
                value={formData.impressions}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clicks">Clicks</Label>
              <Input
                id="clicks"
                name="clicks"
                type="number"
                placeholder="500"
                value={formData.clicks}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversions">Conversions</Label>
              <Input
                id="conversions"
                name="conversions"
                type="number"
                placeholder="25"
                value={formData.conversions}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                placeholder="1200"
                value={formData.cost}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topKeywords">Top Performing Keywords</Label>
              <Textarea
                id="topKeywords"
                name="topKeywords"
                placeholder="Enter top performing keywords, one per line"
                value={formData.topKeywords}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/customers/${customerId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Metrics"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

