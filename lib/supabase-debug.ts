// Debug utility for Supabase connection issues
import { getSupabaseClient } from './supabase'

export async function diagnoseSupabaseConnection() {
	// Step 1: Check environment variables
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseKey) {
		console.error('❌ Missing required environment variables')
		return {
			success: false,
			message: 'Missing required environment variables',
			details: {
				url: !!supabaseUrl,
				key: !!supabaseKey,
			},
		}
	}

	// Step 2: Try to initialize the client
	try {
		const supabase = getSupabaseClient()

		// Step 3: Test a simple ping query with timeout
		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 5000)

			console.time('Database ping')
			const { data, error } = await supabase
				.from('users')
				.select('count()', { count: 'exact' })
				.limit(1)
				.abortSignal(controller.signal)
			console.timeEnd('Database ping')

			clearTimeout(timeoutId)

			if (error) {
				console.error('❌ Database query failed:', error)
				return {
					success: false,
					message: 'Database query failed',
					error: error,
				}
			}

			// Step 4: Test auth service
			const authController = new AbortController()
			const authTimeoutId = setTimeout(() => authController.abort(), 5000)

			console.time('Auth service check')
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
			console.timeEnd('Auth service check')

			clearTimeout(authTimeoutId)

			if (sessionError) {
				console.error('❌ Auth service check failed:', sessionError)
				return {
					success: false,
					message: 'Auth service check failed',
					error: sessionError,
				}
			}

			return {
				success: true,
				message: 'All Supabase services are working correctly',
				details: {
					dbConnected: true,
					authServiceWorking: true,
				},
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.error('❌ Database query timed out after 5 seconds')
				return {
					success: false,
					message: 'Database query timed out',
					error: error,
				}
			}

			console.error('❌ Database connectivity test failed:', error)
			return {
				success: false,
				message: 'Database connectivity test failed',
				error: error,
			}
		}
	} catch (error) {
		console.error('❌ Failed to initialize Supabase client:', error)
		return {
			success: false,
			message: 'Failed to initialize Supabase client',
			error: error,
		}
	}
}
