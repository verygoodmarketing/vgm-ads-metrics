"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, LinkIcon, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { createClientSupabaseClient, type User as SupabaseUser, type Customer } from "@/lib/supabase"

export default function AssignCustomersPage() {
  const { user: currentUser, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Assignment dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [userCustomers, setUserCustomers] = useState<Customer[]>([])

  // Check if user has admin permission
  useEffect(() => {
    if (currentUser && !hasPermission("admin")) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [currentUser, hasPermission, router, toast])

  // Fetch client users
  useEffect(() => {
    const fetchClientUsers = async () => {
      if (!currentUser || !hasPermission("admin")) return

      setIsLoading(true)
      setIsError(false)

      try {
        const { data, error } = await supabase.from("users").select("*").eq("role", "client").order("name")

        if (error) throw error

        setUsers(data as SupabaseUser[])
      } catch (error) {
        console.error("Error fetching client users:", error)
        setIsError(true)
        toast({
          title: "Error",
          description: "Failed to load client users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientUsers()
  }, [currentUser, hasPermission, supabase, toast])

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentUser || !hasPermission("admin")) return

      try {
        const { data, error } = await supabase.from("customers").select("*").order("name")

        if (error) throw error

        setCustomers(data as Customer[])
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchCustomers()
  }, [currentUser, hasPermission, supabase, toast])

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle opening assign dialog
  const handleAssignCustomers = async (user: SupabaseUser) => {
    setSelectedUser(user)

    try {
      // Fetch customers assigned to this user
      const { data, error } = await supabase.from("customers").select("*").eq("user_id", user.id).order("name")

      if (error) throw error

      setUserCustomers(data as Customer[])
      setIsAssignDialogOpen(true)
    } catch (error) {
      console.error("Error fetching user's customers:", error)
      toast({
        title: "Error",
        description: "Failed to load user's customers. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle assigning customer
  const handleAssignCustomer = async () => {
    if (!selectedUser || !selectedCustomerId) return

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          user_id: selectedUser.id,
        })
        .eq("id", selectedCustomerId)

      if (error) throw error

      // Update local state
      const assignedCustomer = customers.find((c) => c.id === selectedCustomerId)
      if (assignedCustomer) {
        setUserCustomers([...userCustomers, assignedCustomer])
      }

      toast({
        title: "Customer assigned",
        description: `Customer has been assigned to ${selectedUser.name}.`,
      })

      // Reset selection
      setSelectedCustomerId("")
    } catch (error: any) {
      console.error("Error assigning customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle unassigning customer
  const handleUnassignCustomer = async (customerId: string) => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          user_id: null,
        })
        .eq("id", customerId)

      if (error) throw error

      // Update local state
      setUserCustomers(userCustomers.filter((c) => c.id !== customerId))

      toast({
        title: "Customer unassigned",
        description: `Customer has been unassigned from ${selectedUser.name}.`,
      })
    } catch (error: any) {
      console.error("Error unassigning customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to unassign customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // If not admin, don't render the page
  if (!currentUser || !hasPermission("admin")) {
    return null
  }

  // Get available customers (not assigned to this user)
  const availableCustomers = customers.filter((customer) => !userCustomers.some((uc) => uc.id === customer.id))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assign Customers to Clients</h2>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search client users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Customers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading client users...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-red-500">Failed to load client users.</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No client users found. Try a different search or add new client users.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{customers.filter((c) => c.user_id === user.id).length} customers</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleAssignCustomers(user)}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Manage Assignments
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Customers Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Customer Assignments</DialogTitle>
            <DialogDescription>Assign or unassign customers for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Assign Customer
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                  disabled={availableCustomers.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignCustomer} disabled={!selectedCustomerId}>
                  Assign
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No customers assigned to this user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              customer.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {customer.status === "active" ? (
                              <>
                                <Check className="mr-1 h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <X className="mr-1 h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleUnassignCustomer(customer.id)}>
                            Unassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAssignDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

