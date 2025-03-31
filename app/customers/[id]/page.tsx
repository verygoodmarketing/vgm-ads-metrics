"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { Trash2, Edit, PlusCircle, ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mock customer data
const mockCustomers = [
  { id: "1", name: "Acme Inc." },
  { id: "2", name: "Globex Corporation" },
  { id: "3", name: "Initech" },
  { id: "4", name: "Umbrella Corp" },
]

// Mock metrics data
const mockMetricsData = [
  { week: "Week 1", impressions: 12500, clicks: 450, conversions: 25, cost: 1200, ctr: 3.6, cpc: 2.67, cpa: 48 },
  { week: "Week 2", impressions: 13200, clicks: 520, conversions: 32, cost: 1350, ctr: 3.9, cpc: 2.6, cpa: 42.19 },
  { week: "Week 3", impressions: 14800, clicks: 580, conversions: 38, cost: 1480, ctr: 3.92, cpc: 2.55, cpa: 38.95 },
  { week: "Week 4", impressions: 15300, clicks: 610, conversions: 42, cost: 1550, ctr: 3.99, cpc: 2.54, cpa: 36.9 },
]

// Mock keywords data
const mockKeywordsData = [
  {
    keyword: "digital marketing",
    impressions: 5200,
    clicks: 210,
    conversions: 15,
    cost: 520,
    ctr: 4.04,
    cpc: 2.48,
    cpa: 34.67,
  },
  {
    keyword: "online advertising",
    impressions: 4800,
    clicks: 180,
    conversions: 12,
    cost: 450,
    ctr: 3.75,
    cpc: 2.5,
    cpa: 37.5,
  },
  {
    keyword: "google ads management",
    impressions: 3200,
    clicks: 140,
    conversions: 10,
    cost: 380,
    ctr: 4.38,
    cpc: 2.71,
    cpa: 38.0,
  },
  { keyword: "ppc services", impressions: 2100, clicks: 80, conversions: 5, cost: 200, ctr: 3.81, cpc: 2.5, cpa: 40.0 },
]

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const customer = mockCustomers.find((c) => c.id === customerId) || { id: "0", name: "Unknown Customer" }

  const [timeframe, setTimeframe] = useState("last-month")
  const { toast } = useToast()
  const [metricsData, setMetricsData] = useState([...mockMetricsData])
  const [metricsToDelete, setMetricsToDelete] = useState<number | null>(null)

  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("performance")

  // Use effect to set the active tab from URL params after component mounts
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Calculate totals
  const totalImpressions = metricsData.reduce((sum, item) => sum + item.impressions, 0)
  const totalClicks = metricsData.reduce((sum, item) => sum + item.clicks, 0)
  const totalConversions = metricsData.reduce((sum, item) => sum + item.conversions, 0)
  const totalCost = metricsData.reduce((sum, item) => sum + item.cost, 0)
  const avgCTR = totalClicks > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const avgCPC = totalClicks > 0 ? totalCost / totalClicks : 0
  const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0

  const handleDeleteMetrics = (index: number) => {
    setMetricsToDelete(index)
  }

  const confirmDeleteMetrics = () => {
    if (metricsToDelete !== null) {
      const newMetricsData = [...metricsData]
      newMetricsData.splice(metricsToDelete, 1)
      setMetricsData(newMetricsData)

      toast({
        title: "Metrics deleted",
        description: "The metrics data has been successfully deleted.",
      })

      setMetricsToDelete(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customerId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/customers/${customerId}/documents`}>
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/customers/${customerId}/add-metrics`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Metrics
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-quarter">Last Quarter</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
          <TabsTrigger value="metrics-history">Metrics History</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Clicks & Conversions</CardTitle>
                <CardDescription>Weekly trend of clicks and conversions</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    clicks: {
                      label: "Clicks",
                      color: "hsl(var(--chart-1))",
                    },
                    conversions: {
                      label: "Conversions",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="aspect-4/3"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="clicks"
                        stroke="var(--color-clicks)"
                        activeDot={{ r: 8 }}
                      />
                      <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="var(--color-conversions)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impressions</CardTitle>
                <CardDescription>Weekly trend of impressions</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    impressions: {
                      label: "Impressions",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                  className="aspect-4/3"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsData}>
                      <defs>
                        <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-impressions)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-impressions)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stroke="var(--color-impressions)"
                        fillOpacity={1}
                        fill="url(#colorImpressions)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CTR Performance</CardTitle>
              <CardDescription>Click-through rate by week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  ctr: {
                    label: "CTR (%)",
                    color: "hsl(var(--chart-6))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="ctr" stroke="var(--color-ctr)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>Performance metrics for top keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="divide-x divide-border">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Keyword</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Impressions</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Clicks</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CTR</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Conversions</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Cost</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPC</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockKeywordsData.map((keyword) => (
                      <tr key={keyword.keyword} className="divide-x divide-border">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{keyword.keyword}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{keyword.impressions.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{keyword.clicks.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{keyword.ctr.toFixed(2)}%</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{keyword.conversions}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${keyword.cost.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${keyword.cpc.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${keyword.cpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
              <CardDescription>Comparison of top keywords by clicks and conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  clicks: {
                    label: "Clicks",
                    color: "hsl(var(--chart-1))",
                  },
                  conversions: {
                    label: "Conversions",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockKeywordsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="keyword" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="clicks" fill="var(--color-clicks)" name="Clicks" />
                    <Bar dataKey="conversions" fill="var(--color-conversions)" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost Metrics</CardTitle>
                <CardDescription>Weekly cost, CPC, and CPA</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    cost: {
                      label: "Cost ($)",
                      color: "hsl(var(--chart-7))",
                    },
                    cpc: {
                      label: "CPC ($)",
                      color: "hsl(var(--chart-3))",
                    },
                    cpa: {
                      label: "CPA ($)",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="aspect-4/3"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" strokeWidth={2} />
                      <Line type="monotone" dataKey="cpc" stroke="var(--color-cpc)" />
                      <Line type="monotone" dataKey="cpa" stroke="var(--color-cpa)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
                <CardDescription>Weekly cost breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    cost: {
                      label: "Cost ($)",
                      color: "hsl(var(--chart-7))",
                    },
                  }}
                  className="aspect-4/3"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cost" fill="var(--color-cost)" name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Efficiency</CardTitle>
              <CardDescription>Cost per click and cost per acquisition trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="divide-x divide-border">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Week</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Cost</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Clicks</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Conversions</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPC</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metricsData.map((week) => (
                      <tr key={week.week} className="divide-x divide-border">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{week.week}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cost.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.clicks.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.conversions}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cpc.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics History</CardTitle>
              <CardDescription>View and manage previously entered metrics data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="divide-x divide-border">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Week</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Impressions</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Clicks</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CTR</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Conversions</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Cost</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPC</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">CPA</th>
                      <th className="px-4 py-3.5 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metricsData.map((week, index) => (
                      <tr key={week.week} className="divide-x divide-border">
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.week}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.impressions.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.clicks.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.ctr.toFixed(2)}%</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">{week.conversions}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cost.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cpc.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">${week.cpa.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/customers/${customerId}/edit-metrics/${index}`}>
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteMetrics(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={metricsToDelete !== null} onOpenChange={(open) => !open && setMetricsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the metrics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteMetrics}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

