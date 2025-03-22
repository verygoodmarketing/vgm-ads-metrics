"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient, type User, type UserRole } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const fetchUsers = async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const { data, error } = await supabase.from("users").select("*").order("name")

      if (error) throw error

      setUsers(data as User[])
    } catch (error: any) {
      console.error("Error fetching users:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUser = async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) throw error

      return data as User
    } catch (error: any) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: "Failed to load user details.",
        variant: "destructive",
      })
      return null
    }
  }

  const createUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "user",
  ): Promise<User | null> => {
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("Failed to create user account")
      }

      // Insert user into our users table
      const newUser = {
        id: authData.user.id,
        email,
        name,
        role,
        theme_preference: "system",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("users").insert([newUser]).select()

      if (error) throw error

      const createdUser = data[0] as User
      setUsers((prev) => [...prev, createdUser])

      toast({
        title: "User created",
        description: `${name} has been added successfully.`,
      })

      return createdUser
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      })
      return null
    }
  }

  const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
    try {
      const updates = {
        ...userData,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("users").update(updates).eq("id", id).select()

      if (error) throw error

      const updatedUser = data[0] as User
      setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)))

      toast({
        title: "User updated",
        description: `User has been updated successfully.`,
      })

      return updatedUser
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      })
      return null
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      // Delete from users table
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      // Note: This doesn't delete the auth user, which would require admin privileges
      // In a production app, you might want to use a Supabase function to handle this

      setUsers((prev) => prev.filter((user) => user.id !== id))

      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      })

      return true
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      })
      return false
    }
  }

  // Load users on initial mount
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    isLoading,
    isError,
    fetchUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
  }
}

