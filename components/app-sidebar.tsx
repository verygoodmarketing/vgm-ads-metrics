"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BarChart3, Users, LogOut, LayoutDashboard, User2, LineChart, Database, UserCog, Shield } from "lucide-react"
import { useEffect, useState, Suspense } from "react"

import { RoleGate } from "@/components/role-gate"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"

// Create a client component for the sidebar tabs
function SidebarTabs() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "overview"
  const customerId = searchParams.get("customerId")

  // Preserve any existing customerId parameter when navigating between tabs
  const getTabHref = (tab: string) => {
    return `/dashboard?tab=${tab}${customerId ? `&customerId=${customerId}` : ""}`
  }

  const isTabActive = (tab: string) => {
    return activeTab === tab
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Analytics</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button variant={isTabActive("overview") ? "default" : "ghost"} className="w-full justify-start" asChild>
              <Link href={getTabHref("overview")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Overview
              </Link>
            </Button>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button variant={isTabActive("analytics") ? "default" : "ghost"} className="w-full justify-start" asChild>
              <Link href={getTabHref("analytics")}>
                <LineChart className="h-4 w-4 mr-2" />
                Detailed Analytics
              </Link>
            </Button>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button
              variant={isTabActive("metrics-management") ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={getTabHref("metrics-management")}>
                <Database className="h-4 w-4 mr-2" />
                Metrics Management
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const { state } = useSidebar()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !user) return null

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  // Check if we're in any admin route
  const isAdminRoute = pathname.startsWith("/admin")

  const handleLogout = () => {
    logout()
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex items-center justify-between py-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <BarChart3 className="h-6 w-6" />
          <span>VGM Ads Metrics</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button variant={isActive("/dashboard") ? "default" : "ghost"} className="w-full justify-start" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </SidebarMenuItem>

              <RoleGate allowedRoles={["admin", "user"]}>
                <SidebarMenuItem>
                  <Button
                    variant={isActive("/customers") ? "default" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/customers">
                      <Users className="h-4 w-4 mr-2" />
                      Customers
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </RoleGate>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Group */}
        <Suspense
          fallback={
            <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Button variant="ghost" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Loading...
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          }
        >
          <SidebarTabs />
        </Suspense>

        {/* Admin Group - Only visible to admins */}
        <RoleGate allowedRoles="admin">
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button
                    variant={
                      isActive("/admin/users") || (isAdminRoute && pathname.includes("users")) ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/admin/users">
                      <UserCog className="h-4 w-4 mr-2" />
                      User Management
                    </Link>
                  </Button>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Button
                    variant={
                      isActive("/admin/roles") || (isAdminRoute && pathname.includes("roles")) ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/admin/roles">
                      <Shield className="h-4 w-4 mr-2" />
                      Role Management
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </RoleGate>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs mr-2">
                    {user.name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate">{user.name}</span>
                  <Badge className="ml-2">{user.role}</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/settings?tab=profile">
                    <User2 className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

