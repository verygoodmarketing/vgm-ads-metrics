'use client'

import type React from 'react'
import { useCache } from '@/lib/cache-context'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
	Loader2,
	ArrowUpRight,
	ArrowDownRight,
	DollarSign,
	MousePointerClick,
	Eye,
	BarChart3,
	PlusCircle,
	Edit,
	Trash2,
	Filter,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { Customer, Metric } from '@/lib/supabase'
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	CartesianGrid,
	Legend,
	LineChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

// Create a client component that uses useSearchParams
function DashboardContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const { toast } = useToast()

	// Generate years from 2020 to current year
	const currentYear = new Date().getFullYear()
	const years = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString())

	// All months
	const allMonths = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]

	// Function to get formatted period label
	const getPeriodLabel = (year: string, month: string, week: string) => {
		return `${month} ${year} - ${week}`
	}

	// Function to get current month and year
	const getCurrentMonthYear = () => {
		const now = new Date()
		const month = allMonths[now.getMonth()]
		const year = now.getFullYear().toString()
		return { month, year }
	}

	// Update the Tabs component to use the tab from URL parameters
	const urlTab = searchParams.get('tab') || 'overview'
	const [activeTab, setActiveTab] = useState(urlTab)

	// Get customer ID from URL if available
	const urlCustomerId = searchParams.get('customerId')

	const [customers, setCustomers] = useState<Customer[]>([])
	const [selectedCustomer, setSelectedCustomer] = useState(urlCustomerId || '')
	const [metricsData, setMetricsData] = useState<Metric[]>([])
	const [filteredMetrics, setFilteredMetrics] = useState<Metric[]>([])
	const [metricToDelete, setMetricToDelete] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Filter state
	const [selectedYear, setSelectedYear] = useState<string>('all')
	const [selectedMonth, setSelectedMonth] = useState<string>('all')
	const [selectedYears, setSelectedYears] = useState<string[]>([])
	const [selectedMonths, setSelectedMonths] = useState<string[]>([])
	const [isFilterOpen, setIsFilterOpen] = useState(false)

	// Form state for add/edit metric dialog
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const { month: currentMonth, year: currentYearStr } = getCurrentMonthYear()
	const [currentMetric, setCurrentMetric] = useState({
		id: '',
		customer_id: '',
		month: currentMonth,
		year: currentYearStr,
		week: 'Week 1',
		impressions: '',
		clicks: '',
		conversions: '',
		cost: '',
	})

	// Chart container component
	const ChartContainer = ({ children }: { children: React.ReactNode }) => {
		return <div className="w-full h-full">{children}</div>
	}

	// Custom tooltip content
	const ChartTooltipContent = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="p-2 bg-white border rounded shadow-md">
					<p className="font-bold">{`${label}`}</p>
					{payload.map((item: any) => (
						<p
							key={item.dataKey}
							className="text-sm text-gray-800"
						>
							{`${item.name}: ${item.value}`}
						</p>
					))}
				</div>
			)
		}

		return null
	}

	// Import the cache context
	const {
		customers: cachedCustomers,
		setCustomers: setCachedCustomers,
		metrics: cachedMetrics,
		setMetricsForCustomer,
	} = useCache()

	// Fetch customers on component mount, using cache if available
	useEffect(() => {
		const fetchCustomers = async () => {
			// If we have cached customers, use them
			if (cachedCustomers) {
				setCustomers(cachedCustomers)

				// Set default selected customer if none is selected
				if (!selectedCustomer && cachedCustomers.length > 0) {
					setSelectedCustomer(cachedCustomers[0].id)
				}
				return
			}

			try {
				const response = await fetch('/api/customers')
				if (!response.ok) {
					throw new Error('Failed to fetch customers')
				}
				const data = await response.json()

				// Update both local state and cache
				setCustomers(data)
				setCachedCustomers(data)

				// Set default selected customer if none is selected
				if (!selectedCustomer && data.length > 0) {
					setSelectedCustomer(data[0].id)
				}
			} catch (error) {
				console.error('Error fetching customers:', error)
				toast({
					title: 'Error',
					description: 'Failed to load customers. Please try again.',
					variant: 'destructive',
				})
			}
		}

		fetchCustomers()
		// Only run this effect once on component mount
	}, [])

	// Fetch metrics when selected customer changes, using cache if available
	useEffect(() => {
		const fetchMetrics = async () => {
			if (!selectedCustomer) return

			// Check if we have cached metrics for this customer
			if (cachedMetrics[selectedCustomer]) {
				setMetricsData(cachedMetrics[selectedCustomer])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			try {
				const response = await fetch(`/api/metrics?customerId=${selectedCustomer}`)
				if (!response.ok) {
					throw new Error('Failed to fetch metrics')
				}
				const data = await response.json()

				// Update both local state and cache
				setMetricsData(data)
				setMetricsForCustomer(selectedCustomer, data)
			} catch (error) {
				console.error('Error fetching metrics:', error)
				toast({
					title: 'Error',
					description: 'Failed to load metrics. Please try again.',
					variant: 'destructive',
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchMetrics()
	}, [selectedCustomer, toast, cachedMetrics, setMetricsForCustomer])

	// Get unique years and months from data for filtering
	useEffect(() => {
		const uniqueYears = Array.from(new Set(metricsData.map(metric => metric.year))).sort(
			(a, b) => Number.parseInt(a) - Number.parseInt(b)
		)
		const uniqueMonths = Array.from(new Set(metricsData.map(metric => metric.month)))

		// Initialize selected years and months if empty
		if (selectedYears.length === 0 && uniqueYears.length > 0) {
			setSelectedYears(uniqueYears)
		}
		if (selectedMonths.length === 0 && uniqueMonths.length > 0) {
			setSelectedMonths(allMonths)
		}
	}, [metricsData, selectedYears, selectedMonths])

	// Update filtered metrics when filters change
	useEffect(() => {
		let filtered = metricsData

		// Filter by year if not "all"
		if (selectedYear !== 'all') {
			filtered = filtered.filter(metric => metric.year === selectedYear)
		} else if (selectedYears.length > 0) {
			// Filter by multiple selected years
			filtered = filtered.filter(metric => selectedYears.includes(metric.year))
		}

		// Filter by month if not "all"
		if (selectedMonth !== 'all') {
			filtered = filtered.filter(metric => metric.month === selectedMonth)
		} else if (selectedMonths.length > 0) {
			// Filter by multiple selected months
			filtered = filtered.filter(metric => selectedMonths.includes(metric.month))
		}

		// Sort chronologically
		filtered = [...filtered].sort((a, b) => {
			// Sort by year first
			if (a.year !== b.year) {
				return Number.parseInt(a.year) - Number.parseInt(b.year)
			}

			// Then by month
			const monthOrder = {
				January: 1,
				February: 2,
				March: 3,
				April: 4,
				May: 5,
				June: 6,
				July: 7,
				August: 8,
				September: 9,
				October: 10,
				November: 11,
				December: 12,
			}
			if (a.month !== b.month) {
				return monthOrder[a.month as keyof typeof monthOrder] - monthOrder[b.month as keyof typeof monthOrder]
			}

			// Then by week
			return Number.parseInt(a.week.split(' ')[1]) - Number.parseInt(b.week.split(' ')[1])
		})

		setFilteredMetrics(filtered)
	}, [metricsData, selectedYear, selectedMonth, selectedYears, selectedMonths])

	// Update URL when customer changes
	useEffect(() => {
		if (urlCustomerId !== selectedCustomer && selectedCustomer) {
			router.push(`/dashboard?customerId=${selectedCustomer}${urlTab ? `&tab=${urlTab}` : ''}`)
		}
	}, [selectedCustomer, router, urlCustomerId, urlTab])

	// Calculate totals and averages for the filtered data
	const totalImpressions = filteredMetrics.reduce((sum, item) => sum + item.impressions, 0)
	const totalClicks = filteredMetrics.reduce((sum, item) => sum + item.clicks, 0)
	const totalConversions = filteredMetrics.reduce((sum, item) => sum + item.conversions, 0)
	const totalCost = filteredMetrics.reduce((sum, item) => sum + item.cost, 0)
	const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
	const avgCPC = totalClicks > 0 ? totalCost / totalClicks : 0
	const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0

	// Calculate period-over-period changes if we have at least 2 periods of data
	const hasMultiplePeriods = filteredMetrics.length >= 2
	const lastPeriodData = hasMultiplePeriods ? filteredMetrics[filteredMetrics.length - 1] : null
	const previousPeriodData = hasMultiplePeriods ? filteredMetrics[filteredMetrics.length - 2] : null

	const clicksChange =
		hasMultiplePeriods && previousPeriodData && previousPeriodData.clicks > 0 && lastPeriodData
			? ((lastPeriodData.clicks - previousPeriodData.clicks) / previousPeriodData.clicks) * 100
			: 0

	const conversionsChange =
		hasMultiplePeriods && previousPeriodData && previousPeriodData.conversions > 0 && lastPeriodData
			? ((lastPeriodData.conversions - previousPeriodData.conversions) / previousPeriodData.conversions) * 100
			: 0

	const cpaChange =
		hasMultiplePeriods && previousPeriodData && previousPeriodData.cpa > 0 && lastPeriodData
			? ((previousPeriodData.cpa - lastPeriodData.cpa) / previousPeriodData.cpa) * 100
			: 0 // Lower CPA is better

	const ctrChange =
		hasMultiplePeriods && previousPeriodData && previousPeriodData.ctr > 0 && lastPeriodData
			? ((lastPeriodData.ctr - previousPeriodData.ctr) / previousPeriodData.ctr) * 100
			: 0

	// Handle opening the edit dialog
	const handleEditMetric = (metric: Metric) => {
		setIsEditing(true)
		setCurrentMetric({
			id: metric.id,
			customer_id: metric.customer_id,
			month: metric.month,
			year: metric.year,
			week: metric.week,
			impressions: metric.impressions.toString(),
			clicks: metric.clicks.toString(),
			conversions: metric.conversions.toString(),
			cost: metric.cost.toString(),
		})
		setIsDialogOpen(true)
	}

	// Handle opening the add dialog
	const handleAddMetric = () => {
		setIsEditing(false)
		setCurrentMetric({
			id: '',
			customer_id: selectedCustomer,
			month: currentMonth,
			year: currentYearStr,
			week: 'Week 1',
			impressions: '',
			clicks: '',
			conversions: '',
			cost: '',
		})
		setIsDialogOpen(true)
	}

	// Handle form input changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setCurrentMetric(prev => ({ ...prev, [name]: value }))
	}

	// Handle select changes
	const handleSelectChange = (name: string, value: string) => {
		setCurrentMetric(prev => ({ ...prev, [name]: value }))
	}

	// Handle form submission
	const handleSubmitMetric = async () => {
		try {
			// Convert string values to numbers
			const metricData = {
				customer_id: selectedCustomer,
				year: currentMetric.year,
				month: currentMetric.month,
				week: currentMetric.week,
				impressions: Number.parseInt(currentMetric.impressions),
				clicks: Number.parseInt(currentMetric.clicks),
				conversions: Number.parseInt(currentMetric.conversions),
				cost: Number.parseFloat(currentMetric.cost),
			}

			if (isEditing) {
				// Update existing metric
				const response = await fetch(`/api/metrics/${currentMetric.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(metricData),
				})

				if (!response.ok) {
					throw new Error('Failed to update metric')
				}

				const updatedMetric = await response.json()

				const updatedMetrics = metricsData.map(metric => (metric.id === currentMetric.id ? updatedMetric : metric))
				setMetricsData(updatedMetrics)

				// Update cache
				updateMetricsCache(updatedMetrics)

				toast({
					title: 'Metric updated',
					description: `Metrics for ${getPeriodLabel(currentMetric.year, currentMetric.month, currentMetric.week)} have been updated.`,
				})
			} else {
				// Add new metric
				const response = await fetch('/api/metrics', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(metricData),
				})

				if (!response.ok) {
					throw new Error('Failed to add metric')
				}

				const newMetric = await response.json()
				const updatedMetrics = [...metricsData, newMetric]
				setMetricsData(updatedMetrics)

				// Update cache
				updateMetricsCache(updatedMetrics)

				toast({
					title: 'Metric added',
					description: `Metrics for ${getPeriodLabel(currentMetric.year, currentMetric.month, currentMetric.week)} have been added.`,
				})
			}

			setIsDialogOpen(false)
		} catch (error) {
			console.error('Error submitting metric:', error)
			toast({
				title: 'Error',
				description: 'Failed to save metric data. Please try again.',
				variant: 'destructive',
			})
		}
	}

	// Handle delete confirmation
	const confirmDeleteMetric = async () => {
		if (metricToDelete) {
			try {
				const response = await fetch(`/api/metrics/${metricToDelete}`, {
					method: 'DELETE',
				})

				if (!response.ok) {
					throw new Error('Failed to delete metric')
				}

				const updatedMetrics = metricsData.filter(metric => metric.id !== metricToDelete)
				setMetricsData(updatedMetrics)

				// Update cache
				updateMetricsCache(updatedMetrics)

				toast({
					title: 'Metric deleted',
					description: 'The metrics data has been successfully deleted.',
				})
			} catch (error) {
				console.error('Error deleting metric:', error)
				toast({
					title: 'Error',
					description: 'Failed to delete metric. Please try again.',
					variant: 'destructive',
				})
			} finally {
				setMetricToDelete(null)
			}
		}
	}

	// Update cache when metrics are added, edited, or deleted
	const updateMetricsCache = (updatedMetrics: Metric[]) => {
		if (selectedCustomer) {
			setMetricsForCustomer(selectedCustomer, updatedMetrics)
		}
	}
	const handleYearCheckboxChange = (year: string) => {
		setSelectedYears(prev => {
			if (prev.includes(year)) {
				return prev.filter(y => y !== year)
			} else {
				return [...prev, year]
			}
		})
	}

	// Handle month checkbox change
	const handleMonthCheckboxChange = (month: string) => {
		setSelectedMonths(prev => {
			if (prev.includes(month)) {
				return prev.filter(m => m !== month)
			} else {
				return [...prev, month]
			}
		})
	}

	// Handle select all years
	const handleSelectAllYears = () => {
		const uniqueYears = Array.from(new Set(metricsData.map(metric => metric.year)))
		setSelectedYears(uniqueYears)
	}

	// Handle select all months
	const handleSelectAllMonths = () => {
		setSelectedMonths(allMonths)
	}

	// Handle clear all years
	const handleClearAllYears = () => {
		setSelectedYears([])
	}

	// Handle clear all months
	const handleClearAllMonths = () => {
		setSelectedMonths([])
	}

	// Format data for charts to include year-month labels
	const formattedChartData = filteredMetrics.map(metric => ({
		...metric,
		period: `${metric.month.substring(0, 3)} ${metric.year.substring(2)} - ${metric.week.split(' ')[1]}`,
		cpc: metric.cpc,
		cpa: metric.cpa,
		ctr: metric.ctr * 100,
	}))

	// Add this effect to update the active tab when URL parameters change
	useEffect(() => {
		const tab = searchParams.get('tab') || 'overview'
		setActiveTab(tab)
	}, [searchParams])

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
				<div className="flex items-center space-x-2">
					<Popover
						open={isFilterOpen}
						onOpenChange={setIsFilterOpen}
					>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="flex items-center gap-2"
							>
								<Filter className="h-4 w-4" />
								<span>Filter</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="grid gap-4">
								<div className="space-y-2">
									<h4 className="font-medium">Filter by Year</h4>
									<div className="flex items-center justify-between">
										<Button
											variant="outline"
											size="sm"
											onClick={handleSelectAllYears}
											className="h-7 text-xs"
										>
											Select All
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleClearAllYears}
											className="h-7 text-xs"
										>
											Clear All
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2">
										{Array.from(new Set(metricsData.map(metric => metric.year)))
											.sort()
											.map(year => (
												<div
													key={year}
													className="flex items-center space-x-2"
												>
													<Checkbox
														id={`year-${year}`}
														checked={selectedYears.includes(year)}
														onCheckedChange={() => handleYearCheckboxChange(year)}
													/>
													<label
														htmlFor={`year-${year}`}
														className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
													>
														{year}
													</label>
												</div>
											))}
									</div>
								</div>
								<div className="space-y-2">
									<h4 className="font-medium">Filter by Month</h4>
									<div className="flex items-center justify-between">
										<Button
											variant="outline"
											size="sm"
											onClick={handleSelectAllMonths}
											className="h-7 text-xs"
										>
											Select All
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleClearAllMonths}
											className="h-7 text-xs"
										>
											Clear All
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
										{allMonths.map(month => (
											<div
												key={month}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={`month-${month}`}
													checked={selectedMonths.includes(month)}
													onCheckedChange={() => handleMonthCheckboxChange(month)}
												/>
												<label
													htmlFor={`month-${month}`}
													className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{month}
												</label>
											</div>
										))}
									</div>
								</div>
								<Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
							</div>
						</PopoverContent>
					</Popover>

					<Select
						value={selectedCustomer}
						onValueChange={setSelectedCustomer}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select customer" />
						</SelectTrigger>
						<SelectContent>
							{customers.map(customer => (
								<SelectItem
									key={customer.id}
									value={customer.id}
								>
									{customer.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="ml-2 text-lg">Loading dashboard data...</p>
				</div>
			) : (
				<>
					<Tabs
						value={activeTab}
						className="space-y-4"
						onValueChange={value => {
							setActiveTab(value)
							router.push(`/dashboard?tab=${value}${selectedCustomer ? `&customerId=${selectedCustomer}` : ''}`)
						}}
					>
						<TabsList>
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="analytics">Analytics</TabsTrigger>
							<TabsTrigger value="metrics-management">Metrics Management</TabsTrigger>
						</TabsList>

						<TabsContent
							value="overview"
							className="space-y-4"
						>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Clicks</CardTitle>
										<MousePointerClick className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
										{hasMultiplePeriods && (
											<div className="flex items-center space-x-2 text-xs text-muted-foreground">
												{clicksChange >= 0 ? (
													<ArrowUpRight className="h-4 w-4 text-green-500" />
												) : (
													<ArrowDownRight className="h-4 w-4 text-red-500" />
												)}
												<span className={clicksChange >= 0 ? 'text-green-500' : 'text-red-500'}>
													{Math.abs(clicksChange).toFixed(1)}% from previous period
												</span>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Conversions</CardTitle>
										<BarChart3 className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">{totalConversions}</div>
										{hasMultiplePeriods && (
											<div className="flex items-center space-x-2 text-xs text-muted-foreground">
												{conversionsChange >= 0 ? (
													<ArrowUpRight className="h-4 w-4 text-green-500" />
												) : (
													<ArrowDownRight className="h-4 w-4 text-red-500" />
												)}
												<span className={conversionsChange >= 0 ? 'text-green-500' : 'text-red-500'}>
													{Math.abs(conversionsChange).toFixed(1)}% from previous period
												</span>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Cost Per Acquisition</CardTitle>
										<DollarSign className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">${avgCPA.toFixed(2)}</div>
										{hasMultiplePeriods && (
											<div className="flex items-center space-x-2 text-xs text-muted-foreground">
												{cpaChange >= 0 ? (
													<ArrowUpRight className="h-4 w-4 text-green-500" />
												) : (
													<ArrowDownRight className="h-4 w-4 text-red-500" />
												)}
												<span className={cpaChange >= 0 ? 'text-green-500' : 'text-red-500'}>
													{Math.abs(cpaChange).toFixed(1)}% from previous period
												</span>
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
										<Eye className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
										{hasMultiplePeriods && (
											<div className="flex items-center space-x-2 text-xs text-muted-foreground">
												{ctrChange >= 0 ? (
													<ArrowUpRight className="h-4 w-4 text-green-500" />
												) : (
													<ArrowDownRight className="h-4 w-4 text-red-500" />
												)}
												<span className={ctrChange >= 0 ? 'text-green-500' : 'text-red-500'}>
													{Math.abs(ctrChange).toFixed(1)}% from previous period
												</span>
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Performance Overview</CardTitle>
										<CardDescription>Clicks and conversions over time</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<BarChart data={formattedChartData.slice(-6)}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis />
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Bar
														dataKey="clicks"
														fill="#3b82f6"
														name="Clicks"
														radius={[4, 4, 0, 0]}
													/>
													<Bar
														dataKey="conversions"
														fill="#10b981"
														name="Conversions"
														radius={[4, 4, 0, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Cost Efficiency</CardTitle>
										<CardDescription>CPC and CPA trends</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<LineChart data={formattedChartData.slice(-6)}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis />
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Line
														type="monotone"
														dataKey="cpc"
														stroke="#f59e0b"
														name="CPC ($)"
														strokeWidth={2}
													/>
													<Line
														type="monotone"
														dataKey="cpa"
														stroke="#ef4444"
														name="CPA ($)"
														strokeWidth={2}
													/>
												</LineChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent
							value="analytics"
							className="space-y-4"
						>
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Clicks & Impressions</CardTitle>
										<CardDescription>Trend of clicks and impressions over time</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<LineChart data={formattedChartData}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis yAxisId="left" />
													<YAxis
														yAxisId="right"
														orientation="right"
													/>
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Line
														yAxisId="left"
														type="monotone"
														dataKey="impressions"
														stroke="#8884d8"
														name="Impressions"
														strokeWidth={2}
													/>
													<Line
														yAxisId="right"
														type="monotone"
														dataKey="clicks"
														stroke="#3b82f6"
														name="Clicks"
														strokeWidth={2}
													/>
												</LineChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Conversions</CardTitle>
										<CardDescription>Conversion trend over time</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<BarChart data={formattedChartData}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis />
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Bar
														dataKey="conversions"
														fill="#10b981"
														name="Conversions"
														radius={[4, 4, 0, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Cost Metrics</CardTitle>
										<CardDescription>CPC and CPA over time</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<LineChart data={formattedChartData}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis />
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Line
														type="monotone"
														dataKey="cpc"
														stroke="#f59e0b"
														name="CPC ($)"
														strokeWidth={2}
													/>
													<Line
														type="monotone"
														dataKey="cpa"
														stroke="#ef4444"
														name="CPA ($)"
														strokeWidth={2}
													/>
												</LineChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>CTR Performance</CardTitle>
										<CardDescription>Click-through rate over time</CardDescription>
									</CardHeader>
									<CardContent className="px-2">
										<div className="h-[300px]">
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<AreaChart data={formattedChartData}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis
														dataKey="period"
														angle={-45}
														textAnchor="end"
														height={70}
														tick={{ fontSize: 12 }}
													/>
													<YAxis />
													<Tooltip content={<ChartTooltipContent />} />
													<Legend />
													<Area
														type="monotone"
														dataKey="ctr"
														stroke="#8b5cf6"
														fill="#8b5cf6"
														fillOpacity={0.3}
														name="CTR (%)"
													/>
												</AreaChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								{/* Year-over-Year Comparison Chart */}
								{selectedYears.length > 1 && (
									<Card className="md:col-span-2">
										<CardHeader>
											<CardTitle>Year-over-Year Comparison</CardTitle>
											<CardDescription>Compare metrics across different years</CardDescription>
										</CardHeader>
										<CardContent className="px-2">
											<div className="h-[400px]">
												<ResponsiveContainer
													width="100%"
													height="100%"
												>
													<BarChart data={formattedChartData}>
														<CartesianGrid strokeDasharray="3 3" />
														<XAxis
															dataKey="period"
															angle={-45}
															textAnchor="end"
															height={70}
															tick={{ fontSize: 12 }}
														/>
														<YAxis />
														<Tooltip content={<ChartTooltipContent />} />
														<Legend />
														<Bar
															dataKey="clicks"
															fill="#3b82f6"
															name="Clicks"
															radius={[4, 4, 0, 0]}
														/>
														<Bar
															dataKey="conversions"
															fill="#10b981"
															name="Conversions"
															radius={[4, 4, 0, 0]}
														/>
													</BarChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>

						<TabsContent
							value="metrics-management"
							className="space-y-4"
						>
							<div className="flex justify-between items-center">
								<h3 className="text-lg font-medium">Metrics History</h3>
								<Button onClick={handleAddMetric}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Add New Metrics
								</Button>
							</div>

							<Card>
								<CardContent className="p-0">
									<div className="rounded-md">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Period</TableHead>
													<TableHead>Impressions</TableHead>
													<TableHead>Clicks</TableHead>
													<TableHead>CTR</TableHead>
													<TableHead>Conversions</TableHead>
													<TableHead>Cost</TableHead>
													<TableHead>CPC</TableHead>
													<TableHead>CPA</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredMetrics.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={9}
															className="text-center py-8 text-muted-foreground"
														>
															No metrics data found. Add new metrics to get started.
														</TableCell>
													</TableRow>
												) : (
													filteredMetrics.map(metric => (
														<TableRow key={metric.id}>
															<TableCell className="font-medium">
																{getPeriodLabel(metric.year, metric.month, metric.week)}
															</TableCell>
															<TableCell>{metric.impressions.toLocaleString()}</TableCell>
															<TableCell>{metric.clicks.toLocaleString()}</TableCell>
															<TableCell>{metric.ctr.toFixed(2)}%</TableCell>
															<TableCell>{metric.conversions}</TableCell>
															<TableCell>${metric.cost.toLocaleString()}</TableCell>
															<TableCell>${metric.cpc.toFixed(2)}</TableCell>
															<TableCell>${metric.cpa.toFixed(2)}</TableCell>
															<TableCell className="text-right">
																<div className="flex justify-end space-x-2">
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleEditMetric(metric)}
																	>
																		<Edit className="h-3.5 w-3.5 mr-1" />
																		Edit
																	</Button>
																	<Button
																		variant="outline"
																		size="sm"
																		className="text-red-500 hover:text-red-600"
																		onClick={() => setMetricToDelete(metric.id)}
																	>
																		<Trash2 className="h-3.5 w-3.5 mr-1" />
																		Delete
																	</Button>
																</div>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					{/* Add/Edit Metric Dialog */}
					<Dialog
						open={isDialogOpen}
						onOpenChange={setIsDialogOpen}
					>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>{isEditing ? 'Edit Metrics' : 'Add New Metrics'}</DialogTitle>
								<DialogDescription>
									{isEditing
										? 'Update the metrics data for the selected period.'
										: 'Enter metrics data for a new period.'}
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="year"
										className="text-right"
									>
										Year
									</Label>
									<div className="col-span-3">
										<Select
											value={currentMetric.year}
											onValueChange={value => handleSelectChange('year', value)}
										>
											<SelectTrigger id="year">
												<SelectValue placeholder="Select year" />
											</SelectTrigger>
											<SelectContent>
												{years.map(year => (
													<SelectItem
														key={year}
														value={year}
													>
														{year}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="month"
										className="text-right"
									>
										Month
									</Label>
									<div className="col-span-3">
										<Select
											value={currentMetric.month}
											onValueChange={value => handleSelectChange('month', value)}
										>
											<SelectTrigger id="month">
												<SelectValue placeholder="Select month" />
											</SelectTrigger>
											<SelectContent>
												{allMonths.map(month => (
													<SelectItem
														key={month}
														value={month}
													>
														{month}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="week"
										className="text-right"
									>
										Week
									</Label>
									<div className="col-span-3">
										<Select
											value={currentMetric.week}
											onValueChange={value => handleSelectChange('week', value)}
										>
											<SelectTrigger id="week">
												<SelectValue placeholder="Select week" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Week 1">Week 1</SelectItem>
												<SelectItem value="Week 2">Week 2</SelectItem>
												<SelectItem value="Week 3">Week 3</SelectItem>
												<SelectItem value="Week 4">Week 4</SelectItem>
												<SelectItem value="Week 5">Week 5</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="impressions"
										className="text-right"
									>
										Impressions
									</Label>
									<Input
										id="impressions"
										name="impressions"
										type="number"
										value={currentMetric.impressions}
										onChange={handleInputChange}
										className="col-span-3"
									/>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="clicks"
										className="text-right"
									>
										Clicks
									</Label>
									<Input
										id="clicks"
										name="clicks"
										type="number"
										value={currentMetric.clicks}
										onChange={handleInputChange}
										className="col-span-3"
									/>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="conversions"
										className="text-right"
									>
										Conversions
									</Label>
									<Input
										id="conversions"
										name="conversions"
										type="number"
										value={currentMetric.conversions}
										onChange={handleInputChange}
										className="col-span-3"
									/>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="cost"
										className="text-right"
									>
										Cost ($)
									</Label>
									<Input
										id="cost"
										name="cost"
										type="number"
										value={currentMetric.cost}
										onChange={handleInputChange}
										className="col-span-3"
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleSubmitMetric}
								>
									{isEditing ? 'Update Metrics' : 'Add Metrics'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Delete Confirmation Dialog */}
					<AlertDialog
						open={!!metricToDelete}
						onOpenChange={open => !open && setMetricToDelete(null)}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete the metrics data.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-red-600 hover:bg-red-700"
									onClick={confirmDeleteMetric}
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</div>
	)
}

// Main dashboard page with Suspense boundary
export default function DashboardPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
					<p>Loading dashboard...</p>
				</div>
			}
		>
			<DashboardContent />
		</Suspense>
	)
}
