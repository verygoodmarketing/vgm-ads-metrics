'use client'

import type React from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

// Create a client component for the dashboard header that uses useSearchParams
function DashboardHeader() {
	// We need to use the hook directly in the component
	const searchParams = useSearchParams()
	const activeTab = searchParams?.get('tab') || 'overview'

	// Map tab values to display names
	const getTabDisplayName = () => {
		switch (activeTab) {
			case 'overview':
				return 'Performance Overview'
			case 'analytics':
				return 'Detailed Analytics'
			case 'metrics-management':
				return 'Metrics Management'
			default:
				return 'Dashboard'
		}
	}

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger className="-ml-1" />
			<div className="ml-2">
				<h1 className="text-xl font-semibold">Dashboard</h1>
				<p className="text-sm text-muted-foreground">{getTabDisplayName()}</p>
			</div>
		</header>
	)
}

// Create a client component wrapper for the header to use with Suspense
const ClientDashboardHeader = () => {
	return (
		<Suspense
			fallback={
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<div className="ml-2">
						<h1 className="text-xl font-semibold">Dashboard</h1>
						<p className="text-sm text-muted-foreground">Loading...</p>
					</div>
				</header>
			}
		>
			<DashboardHeader />
		</Suspense>
	)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const { user, loading, supabaseAvailable } = useAuth()
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)

		// Check if user is authenticated
		if (!loading && !user) {
			router.push('/login')
		}
	}, [user, loading, router])

	if (!isClient || loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin mr-2" />
				<span>Loading...</span>
			</div>
		)
	}

	if (!user) {
		return null
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<ClientDashboardHeader />
				<main className="flex-1">
					{!supabaseAvailable && (
						<Alert
							variant="destructive"
							className="m-4"
						>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Limited Functionality</AlertTitle>
							<AlertDescription>Database connection is unavailable. Some features may be limited.</AlertDescription>
						</Alert>
					)}
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
