import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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

// Singleton instance for client-side
let supabaseInstance: SupabaseClient | null = null

// Create a supabase client for server-side usage
export const createServerSupabaseClient = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
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

		supabaseInstance = createClient(supabaseUrl, supabaseKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: false,
				storageKey: 'vgm-supabase-auth',
			},
			global: {
				fetch: (url, options) => {
					const controller = new AbortController()
					const timeoutId = setTimeout(() => controller.abort(), 15000)
					return fetch(url, {
						...options,
						signal: controller.signal,
					}).finally(() => clearTimeout(timeoutId))
				},
			},
		})

		setupSessionRefresh(supabaseInstance)

		supabaseInstance.auth.onAuthStateChange(event => {
			if (event === 'SIGNED_OUT') {
				localStorage.removeItem('user')
			}
		})
	}

	return supabaseInstance
}

// Set up periodic session refresh
const setupSessionRefresh = (supabase: SupabaseClient) => {
	if (typeof window === 'undefined') return

	const REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes

	const refreshSession = async () => {
		try {
			if (
				process.env.NODE_ENV === 'development' &&
				localStorage.getItem('user') &&
				JSON.parse(localStorage.getItem('user') || '{}').id === 'mock-user-id'
			) {
				return
			}

			await supabase.auth.refreshSession()
		} catch (err) {
			if (process.env.NODE_ENV === 'development') {
				console.error('Error refreshing session:', err)
			}
		}
	}

	const intervalId = setInterval(refreshSession, REFRESH_INTERVAL)
	window.addEventListener('beforeunload', () => clearInterval(intervalId))
	refreshSession()
}

// For backward compatibility
export const createClientSupabaseClient = getSupabaseClient

// Check if Supabase is available
export const isSupabaseAvailable = async (): Promise<boolean> => {
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!supabaseUrl || !supabaseKey) return false

		const supabase = getSupabaseClient()

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)

		const { error } = await supabase.from('users').select('id').limit(1).abortSignal(controller.signal)

		clearTimeout(timeoutId)
		return !error
	} catch (error) {
		return false
	}
}
