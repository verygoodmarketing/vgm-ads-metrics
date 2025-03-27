"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, PlusCircle, Search, Edit, Trash2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { createClientSupabaseClient, type Customer } from "@/lib/supabase"
import { RoleGate } from "@/components/role-gate"

export default function CustomersPage() {
  const { user, hasPermission } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return

      setIsLoading(true)
      setIsError(false)

      try {
        // First, ensure the session is valid by refreshing it
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn("Session refresh failed, continuing with current session:", refreshError);
        }

        const { data, error } = await supabase.from("customers").select("*").order("name")

        if (error) {
          // If we get an unauthorized error, try to refresh the session again
          if (error.code === "PGRST301" || error.message?.includes("JWT")) {
            console.log("Authentication error, attempting to refresh session");
            await supabase.auth.refreshSession();
            
            // Try the query again after refresh
            const retryResult = await supabase.from("customers").select("*").order("name");
            
            if (retryResult.error) {
              throw retryResult.error;
            }
            
            setCustomers(retryResult.data as Customer[]);
            return;
          }
          
          throw error;
        }

        setCustomers(data as Customer[])
      } catch (error) {
        console.error("Error fetching customers:", error)
        setIsError(true)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [user, supabase, toast])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return

    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerToDelete)

      if (error) throw error

      setCustomers(customers.filter((customer) => customer.id !== customerToDelete))
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      })
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCustomerToDelete(null)
    }
  }

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <RoleGate allowedRoles="admin">
          <Button asChild>
            <Link href="/add-customer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </RoleGate>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
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
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-red-500">Failed to load customers.</p>
                    <Button onClick={handleRetry}>Retry</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No customers found. Try a different search or add a new customer.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contact_name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {customer.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(customer.date_added).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard?customerId=${customer.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Manage Metrics</span>
                          </Link>
                        </DropdownMenuItem>
                        <RoleGate allowedRoles="admin">
                          <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Customer</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setCustomerToDelete(customer.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Customer</span>
                          </DropdownMenuItem>
                        </RoleGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteCustomer}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

