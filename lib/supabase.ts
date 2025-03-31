import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Global variable to store the singleton instance
let supabaseInstance: SupabaseClient | null = null

// Types for our database tables
export type Customer = {
	id: string
	name: string
	contact_name: string
	email: string
	phone: string | null
	status: 'active' | 'inactive'
	date_added: string
	created_at: string
	updated_at: string
	user_id?: string | null
}

export type Metric = {
	id: string
	customer_id: string
	year: string
	month: string
	week: string
	impressions: number
	clicks: number
	conversions: number
	cost: number
	ctr: number
	cpc: number
	cpa: number
	created_at: string
	updated_at: string
}

export type UserRole = 'admin' | 'user' | 'client'

export type Theme = 'dark' | 'light' | 'system'

export type User = {
	id: string
	email: string
	name: string
	role: UserRole
	theme_preference?: Theme
	created_at: string
	updated_at: string
}

// Create a single supabase client for server-side usage
export const createServerSupabaseClient = () => {
	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Missing Supabase environment variables')
	}

	return createClient(supabaseUrl, supabaseKey)
}

// Get or create a Supabase client instance
export const getSupabaseClient = (): SupabaseClient => {
	if (typeof window === 'undefined') {
		// Server-side - create a new instance each time
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!supabaseUrl || !supabaseKey) {
			throw new Error('Missing Supabase environment variables')
		}

		return createClient(supabaseUrl, supabaseKey)
	}

	// Client-side - use singleton pattern
	if (!supabaseInstance) {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!supabaseUrl || !supabaseKey) {
			throw new Error('Missing Supabase environment variables')
		}

		// Create a single instance with consistent options
		supabaseInstance = createClient(supabaseUrl, supabaseKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: false,
				storageKey: 'vgm-supabase-auth',
			},
			global: {
				// Set a reasonable timeout for all requests
				fetch: (url, options) => {
					const controller = new AbortController()
					const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

					return fetch(url, {
						...options,
						signal: controller.signal,
					}).finally(() => {
						clearTimeout(timeoutId)
					})
				},
			},
		})

		// Set up session refresh mechanism
		setupSessionRefresh(supabaseInstance)

		// Add event listener for auth state changes
		supabaseInstance.auth.onAuthStateChange((event, session) => {
			if (event === 'TOKEN_REFRESHED') {
				// Token refreshed
			} else if (event === 'SIGNED_OUT') {
				// Clear any cached data
				localStorage.removeItem('user')
			}
		})
	}

	return supabaseInstance
}

// Set up periodic session refresh to prevent token expiration issues
const setupSessionRefresh = (supabase: SupabaseClient) => {
	if (typeof window === 'undefined') return

	// Refresh session every 4 minutes to prevent expiration
	const REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes

	const refreshSession = async () => {
		try {
			// Check if we're using mock user in development
			if (process.env.NODE_ENV === 'development') {
				const mockUser = localStorage.getItem('user')
				if (mockUser && JSON.parse(mockUser).id === 'mock-user-id') {
					// Skip session refresh for mock user
					return
				}
			}

			// Check if we have an existing session before attempting refresh
			const { data: sessionData } = await supabase.auth.getSession()
			if (!sessionData?.session) {
				// No active session, skip refresh
				return
			}

			const { data, error } = await supabase.auth.refreshSession()
			if (error) {
				console.warn('Session refresh failed:', error.message)
			} else if (data.session) {
				// Only log in development
				if (process.env.NODE_ENV === 'development') {
					// Session refreshed
				}
			}
		} catch (err) {
			// Only log in development
			if (process.env.NODE_ENV === 'development') {
				console.error('Error refreshing session:', err)
			}
		}
	}

	// Set up interval for session refresh
	const intervalId = setInterval(refreshSession, REFRESH_INTERVAL)

	// Clean up on page unload
	window.addEventListener('beforeunload', () => {
		clearInterval(intervalId)
	})

	// Do an initial refresh
	refreshSession()
}

// For backward compatibility with existing code
export const createClientSupabaseClient = getSupabaseClient

// Helper function to check if Supabase is available
export const isSupabaseAvailable = async (): Promise<boolean> => {
	try {
		// First check if we have the required environment variables
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!supabaseUrl || !supabaseKey) {
			console.warn('Missing Supabase environment variables')
			return false
		}

		// Try to create a client
		let supabase
		try {
			supabase = getSupabaseClient()
		} catch (error) {
			console.error('Failed to create Supabase client:', error)
			return false
		}

		if (!supabase) return false

		// Make a simple query to check connectivity with a shorter timeout
		try {
			// Create an AbortController to timeout the request
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

			const { data, error } = await supabase.from('users').select('id').limit(1).abortSignal(controller.signal)

			clearTimeout(timeoutId)

			if (error) {
				console.error('Supabase query error:', error)
				return false
			}
			return true
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.error('Supabase query timed out')
			} else {
				console.error('Supabase query failed:', error)
			}
			return false
		}
	} catch (error) {
		console.error('Supabase availability check failed:', error)
		return false
	}
}
