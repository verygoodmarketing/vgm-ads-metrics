'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { Theme } from '@/lib/supabase'
import { getSupabaseClient } from '@/lib/supabase'

type ThemeProviderProps = {
	children: React.ReactNode
	defaultTheme?: Theme
	storageKey?: string
	userId?: string
	isAuthenticated?: boolean
	isSupabaseAvailable?: boolean
}

type ThemeProviderState = {
	theme: Theme
	setTheme: (theme: Theme) => void
	isSaving: boolean
}

const initialState: ThemeProviderState = {
	theme: 'system',
	setTheme: () => null,
	isSaving: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'vgm-ui-theme',
	userId,
	isAuthenticated = false,
	isSupabaseAvailable = true,
	...props
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme)
	const [isSaving, setIsSaving] = useState(false)
	const { toast } = useToast()
	const [isInitialized, setIsInitialized] = useState(false)
	const isMounted = useRef(false)

	// Load theme from localStorage on initial render
	useEffect(() => {
		isMounted.current = true

		// Only run on client side
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem(storageKey)
			if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
				setThemeState(savedTheme as Theme)
			}
			setIsInitialized(true)
		}

		return () => {
			isMounted.current = false
		}
	}, [storageKey])

	// Apply theme to document
	useEffect(() => {
		if (typeof window === 'undefined') return

		const root = window.document.documentElement

		// Remove all class names related to themes
		root.classList.remove('light', 'dark')

		// Add the appropriate class based on the theme
		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
			root.classList.add(systemTheme)
		} else {
			root.classList.add(theme)
		}
	}, [theme])

	// Handle theme changes
	const setTheme = async (newTheme: Theme) => {
		if (!isMounted.current) return

		// Always update localStorage for immediate feedback
		if (typeof window !== 'undefined') {
			localStorage.setItem(storageKey, newTheme)
		}

		setThemeState(newTheme)

		// Try to save to the server if the user is logged in
		if (isAuthenticated && userId && isSupabaseAvailable) {
			try {
				setIsSaving(true)

				// Get the Supabase client
				const supabase = getSupabaseClient()

				// Update directly with Supabase client
				const { error } = await supabase
					.from('users')
					.update({
						theme_preference: newTheme,
						updated_at: new Date().toISOString(),
					})
					.eq('id', userId)

				if (error) {
					throw error
				}
			} catch (error) {
				console.error('Error saving theme preference:', error)
				if (isMounted.current) {
					toast({
						title: 'Theme preference not saved to server',
						description: 'Your theme preference will be applied for this session only.',
						variant: 'destructive',
					})
				}
			} finally {
				if (isMounted.current) {
					setIsSaving(false)
				}
			}
		}
	}

	// Fetch theme preference from server when component mounts
	useEffect(() => {
		if (!isInitialized || typeof window === 'undefined' || !isAuthenticated || !userId || !isSupabaseAvailable) return

		const fetchThemePreference = async () => {
			try {
				// Get the Supabase client
				const supabase = getSupabaseClient()

				const { data, error } = await supabase.from('users').select('theme_preference').eq('id', userId).single()

				if (error) {
					throw error
				}

				if (data?.theme_preference && data.theme_preference !== theme && isMounted.current) {
					setThemeState(data.theme_preference as Theme)
					localStorage.setItem(storageKey, data.theme_preference)
				}
			} catch (error) {
				console.error('Error fetching theme preference:', error)
			}
		}

		fetchThemePreference()
	}, [isInitialized, isAuthenticated, userId, isSupabaseAvailable, storageKey, theme])

	const value = {
		theme,
		setTheme,
		isSaving,
	}

	return (
		<ThemeProviderContext.Provider
			{...props}
			value={value}
		>
			{children}
		</ThemeProviderContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext)

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

	return context
}
