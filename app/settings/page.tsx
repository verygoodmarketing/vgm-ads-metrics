"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Laptop } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme, isSaving } = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  // Set active tab from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["profile", "notifications", "appearance"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    weeklyReports: true,
    performanceAlerts: false,
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate password match if changing password
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both passwords match.",
      })
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      setIsSubmitting(false)
    }, 1000)
  }

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      })
      setIsSubmitting(false)
    }, 1000)
  }

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/settings?tab=${value}`)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information and password.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={profileData.name} onChange={handleProfileChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={profileData.password}
                    onChange={handleProfileChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications and alerts.</CardDescription>
            </CardHeader>
            <form onSubmit={handleNotificationSubmit}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance reports for your customers.
                    </p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => handleNotificationChange("weeklyReports", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="performanceAlerts">Performance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when there are significant changes in performance metrics.
                    </p>
                  </div>
                  <Switch
                    id="performanceAlerts"
                    checked={notificationSettings.performanceAlerts}
                    onCheckedChange={(checked) => handleNotificationChange("performanceAlerts", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the appearance of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Theme</Label>
                <div className="grid grid-cols-3 gap-6">
                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer rounded-md transition-all ${theme === "light" ? "ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="border rounded-md p-4 w-full aspect-square flex items-center justify-center bg-background">
                      <Sun className="h-10 w-10 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer rounded-md transition-all ${theme === "dark" ? "ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="border rounded-md p-4 w-full aspect-square flex items-center justify-center bg-black">
                      <Moon className="h-10 w-10 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer rounded-md transition-all ${theme === "system" ? "ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => setTheme("system")}
                  >
                    <div className="border rounded-md p-4 w-full aspect-square flex items-center justify-center bg-gradient-to-b from-background to-black">
                      <Laptop className="h-10 w-10 text-primary" />
                    </div>
                    <span className="text-sm font-medium">System</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground flex items-center">
                {isSaving ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse mr-2"></span>
                    Saving your theme preference...
                  </>
                ) : (
                  "Your theme preference is automatically saved as you select it."
                )}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

