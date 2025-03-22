"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import type { UserRole } from "@/lib/supabase"

interface RoleGateProps {
  children: ReactNode
  allowedRoles: UserRole | UserRole[]
  fallback?: ReactNode
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(allowedRoles)) {
    return fallback
  }

  return <>{children}</>
}

