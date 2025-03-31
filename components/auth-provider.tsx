'use client'

import type React from 'react'
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient, isSupabaseAvailable, type User, type UserRole } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

type AuthContextType = {
	user: User | null
	loading: boolean
	supabaseAvailable: boolean
	login: (email: string, password: string) => Promise<void>
	signup: (email: string, password: string, name: string) => Promise<void>
	logout: () => Promise<void>
	updateUserProfile: (data: Partial<User>) => Promise<void>
	hasPermission: (requiredRole: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user for development/fallback when Supabase is unavailable
const MOCK_USER: User = {
	id: 'mock-user-id',
	email: 'admin@example.com',
	name: 'Admin User',
	role: 'admin',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	theme_preference: 'system',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [supabaseAvailable, setSupabaseAvailable] = useState(true)
	const router = useRouter()
	const { toast } = useToast()
	const isMounted = useRef(false)
	const authListenerRef = useRef<{ subscription?: { unsubscribe: () => void } }>({})

	// Check if Supabase is available
	useEffect(() => {
		isMounted.current = true

		const checkSupabaseAvailability = async () => {
			try {
				// Clear any existing mock user data to ensure a fresh check
				if (process.env.NODE_ENV === 'development') {
					const storedUser = localStorage.getItem('user')
					if (storedUser && JSON.parse(storedUser).id === 'mock-user-id') {
						localStorage.removeItem('user')
					}
				}

				// Clear any existing Supabase auth data to ensure a fresh check
				localStorage.removeItem('sb-rjwjufncbrpxtjudmxwr-auth-token')
				localStorage.removeItem('vgm-supabase-auth')

				const available = await isSupabaseAvailable()
				if (isMounted.current) {
					setSupabaseAvailable(available)

					// No longer using mock user when Supabase is unavailable
					if (!available) {
						console.warn('Supabase is not available. Database cannot be reached.')
						setUser(null)
					}
				}
			} catch (error) {
				console.error('Error checking Supabase availability:', error)
				if (isMounted.current) {
					setSupabaseAvailable(false)
					setUser(null)
				}
			}
		}

		checkSupabaseAvailability()

		return () => {
			isMounted.current = false
		}
	}, [])

	// Check for existing session and fetch user data
	useEffect(() => {
		let timeoutId: NodeJS.Timeout // Declare timeoutId here

		const checkAuth = async () => {
			try {
				setLoading(true)

				// Add a timeout to prevent infinite loading state
				timeoutId = setTimeout(() => {
					if (isMounted.current && loading) {
						console.warn('Auth check timed out, falling back to logged out state')
						setUser(null)
						setLoading(false)
					}
				}, 15000) // Increased timeout to 15 seconds

				// If Supabase is not available, don't use mock data
				if (!supabaseAvailable) {
					clearTimeout(timeoutId)
					// Don't use mock user, just set user to null
					setUser(null)
					setLoading(false)
					return
				}

				// Get the Supabase client
				const supabase = getSupabaseClient()

				// Check if we're using mock user in development - remove this section
				const storedUser = localStorage.getItem('user')
				if (storedUser) {
					const parsedUser = JSON.parse(storedUser)
					// Remove mock user check
					if (parsedUser.id === 'mock-user-id') {
						// Remove mock user from storage
						localStorage.removeItem('user')
					}
				}

				// Create an AbortController for the session fetch
				const controller = new AbortController()
				const fetchTimeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

				try {
					// Get session with timeout
					const { data, error } = await supabase.auth.getSession()
					clearTimeout(fetchTimeoutId)

					if (error) {
						console.error('Error getting session:', error)
						setUser(null)
						setLoading(false)
						clearTimeout(timeoutId)
						return
					}

					const session = data?.session

					if (session) {
						try {
							// Fetch user profile from our users table with timeout
							const userController = new AbortController()
							const userTimeoutId = setTimeout(() => userController.abort(), 10000)

							const { data: userData, error: userError } = await supabase
								.from('users')
								.select('*')
								.eq('id', session.user.id)
								.single()
								.abortSignal(userController.signal)

							clearTimeout(userTimeoutId)

							if (userError) {
								console.error('Error fetching user data:', userError)
								setUser(null)
							} else if (userData) {
								setUser(userData as User)
								localStorage.setItem('user', JSON.stringify(userData))

								// If user has a theme preference, apply it
								if (userData.theme_preference) {
									localStorage.setItem('vgm-ui-theme', userData.theme_preference)
								}
							} else {
								console.error('No user data found')
								setUser(null)
							}
						} catch (error: any) {
							console.error('Error in user data fetch:', error)
							if (error.name === 'AbortError') {
								console.error('User data fetch timed out')
							}
							setUser(null)
						}
					} else {
						// No session, check localStorage for user data
						if (storedUser) {
							const parsedUser = JSON.parse(storedUser)
							// Remove mock user if found
							if (parsedUser.id === 'mock-user-id') {
								localStorage.removeItem('user')
								setUser(null)
							} else {
								// Otherwise, clear the stored user as the session is invalid
								localStorage.removeItem('user')
								setUser(null)
							}
						} else {
							setUser(null)
						}
					}
				} catch (error: any) {
					clearTimeout(fetchTimeoutId)
					console.error('Auth check failed:', error)
					if (error.name === 'AbortError') {
						console.error('Session fetch timed out')
					}
					setUser(null)
				}
			} catch (error) {
				console.error('Auth check failed:', error)
				setUser(null)
			} finally {
				clearTimeout(timeoutId)
				if (isMounted.current) {
					setLoading(false)
				}
			}
		}

		if (isMounted.current) {
			checkAuth()
		}

		// Set up a periodic check to refresh the session
		const sessionCheckInterval = setInterval(
			() => {
				if (isMounted.current && user) {
					// Skip periodic checks for mock users
					if (user.id === 'mock-user-id') {
						return
					}

					checkAuth()
				}
			},
			15 * 60 * 1000
		) // Check every 15 minutes

		return () => {
			// Cleanup function
			clearInterval(sessionCheckInterval)
		}
	}, [supabaseAvailable])

	// Set up auth state change listener
	useEffect(() => {
		if (!supabaseAvailable || !isMounted.current) {
			return () => {}
		}

		try {
			const supabase = getSupabaseClient()

			// Clean up any existing listener
			if (authListenerRef.current.subscription) {
				authListenerRef.current.subscription.unsubscribe()
			}

			// Set up new listener
			const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
				if (!isMounted.current) return

				if (event === 'SIGNED_IN' && session) {
					// Refresh user data when signed in
					try {
						const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()

						if (!error && data) {
							setUser(data as User)
							localStorage.setItem('user', JSON.stringify(data))
						}
					} catch (error) {
						console.error('Error fetching user data on auth change:', error)
					}
				} else if (event === 'SIGNED_OUT') {
					setUser(null)
					localStorage.removeItem('user')
				}
			})

			authListenerRef.current = data
		} catch (error) {
			console.error('Error setting up auth listener:', error)
		}

		return () => {
			// Clean up auth listener
			if (authListenerRef.current.subscription) {
				authListenerRef.current.subscription.unsubscribe()
			}
		}
	}, [supabaseAvailable])

	const login = async (email: string, password: string) => {
		try {
			setLoading(true)

			// If Supabase is not available, show error
			if (!supabaseAvailable) {
				throw new Error('Authentication service is currently unavailable')
			}

			const supabase = getSupabaseClient()

			// Create an AbortController for the login request
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

			try {
				// Attempt to sign in with timeout
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password,
					options: {
						abortSignal: controller.signal,
					},
				})

				clearTimeout(timeoutId)

				if (error) {
					throw error
				}

				if (!data.session) {
					throw new Error('No session returned from login')
				}

				try {
					// Fetch user profile from our users table with timeout
					const userController = new AbortController()
					const userTimeoutId = setTimeout(() => userController.abort(), 10000)

					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('*')
						.eq('id', data.user.id)
						.single()
						.abortSignal(userController.signal)

					clearTimeout(userTimeoutId)

					if (userError) {
						console.error('Error fetching user data:', userError)
						throw new Error('Failed to fetch user data')
					}

					if (!userData) {
						throw new Error('No user data found')
					}

					// Set user data
					setUser(userData as User)
					localStorage.setItem('user', JSON.stringify(userData))

					// If user has a theme preference, apply it
					if (userData.theme_preference) {
						localStorage.setItem('vgm-ui-theme', userData.theme_preference)
					}
				} catch (error: any) {
					console.error('Error fetching user data after login:', error)
					if (error.name === 'AbortError') {
						throw new Error('User data fetch timed out. Please try again.')
					}

					// Fallback to basic user info
					const basicUser: User = {
						id: data.user.id,
						email: data.user.email || '',
						name: data.user.user_metadata?.name || 'User',
						role: 'user', // Default role
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					}
					setUser(basicUser)
					localStorage.setItem('user', JSON.stringify(basicUser))
				}
			} catch (error: any) {
				clearTimeout(timeoutId)
				if (error.name === 'AbortError') {
					throw new Error('Login request timed out. Please try again.')
				}
				throw error
			}
		} catch (error: any) {
			console.error('Login failed:', error.message)
			throw error
		} finally {
			setLoading(false)
		}
	}

	const signup = async (email: string, password: string, name: string) => {
		try {
			if (!supabaseAvailable) {
				throw new Error('Authentication service is currently unavailable')
			}

			const supabase = getSupabaseClient()

			// Create user with Supabase Auth
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name,
					},
				},
			})

			if (error) {
				throw error
			}

			if (!data.user) {
				throw new Error('Failed to create user account')
			}

			// Insert user into our users table
			const { error: insertError } = await supabase.from('users').insert({
				id: data.user.id,
				email,
				name,
				role: 'user', // Default role for new signups
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})

			if (insertError) {
				console.error('Error inserting user data:', insertError)
				// Continue anyway, as the auth user was created
			}

			toast({
				title: 'Account created',
				description: 'Your account has been created successfully. You can now log in.',
			})

			router.push('/login')
		} catch (error: any) {
			console.error('Signup failed:', error.message)
			throw error
		}
	}

	const logout = async () => {
		try {
			// Clear your app's user data first (this ensures logout works even if Supabase fails)
			setUser(null)
			localStorage.removeItem('user')

			if (supabaseAvailable) {
				const supabase = getSupabaseClient()

				try {
					// Try to refresh the session first to ensure we can logout properly
					await supabase.auth.refreshSession()
				} catch (refreshError) {
					console.warn('Session refresh before logout failed:', refreshError)
					// Continue with logout anyway
				}

				// Clear all Supabase-related storage
				localStorage.removeItem('vgm-supabase-auth')
				localStorage.removeItem('sb-rjwjufncbrpxtjudmxwr-auth-token')

				// Then sign out
				await supabase.auth.signOut()
			}

			router.push('/login')
		} catch (error) {
			console.error('Logout failed:', error)
			// Already cleared user data above, just redirect
			router.push('/login')
		}
	}

	const updateUserProfile = async (data: Partial<User>) => {
		try {
			if (!user) throw new Error('Not authenticated')

			if (!supabaseAvailable) {
				throw new Error('User profile update is currently unavailable')
			}

			const supabase = getSupabaseClient()
			const { error } = await supabase.from('users').update(data).eq('id', user.id)

			if (error) throw error

			// Update local user state
			const updatedUser = { ...user, ...data }
			setUser(updatedUser)
			localStorage.setItem('user', JSON.stringify(updatedUser))

			toast({
				title: 'Profile updated',
				description: 'Your profile has been updated successfully.',
			})
		} catch (error: any) {
			console.error('Profile update failed:', error.message)
			throw error
		}
	}

	// Helper function to check if user has required role
	const hasPermission = (requiredRole: UserRole | UserRole[]) => {
		if (!user) return false

		if (user.role === 'admin') return true // Admin has access to everything

		if (Array.isArray(requiredRole)) {
			return requiredRole.includes(user.role)
		}

		return user.role === requiredRole
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				supabaseAvailable,
				login,
				signup,
				logout,
				updateUserProfile,
				hasPermission,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
