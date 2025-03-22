"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { FileViewer } from "@/components/file-viewer"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient, type Customer } from "@/lib/supabase"

export default function CustomerDocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).single()

        if (error) throw error

        setCustomer(data as Customer)
      } catch (error: any) {
        console.error("Error fetching customer:", error)
        toast({
          title: "Error",
          description: "Failed to load customer details.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId, supabase, toast])

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center h-screen">
          <p>Customer not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/customers/${customerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Documents for {customer.name}</h2>
      </div>

      <Tabs defaultValue="view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">View Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Customer Documents</CardTitle>
              <CardDescription>View and manage documents for {customer.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <FileViewer
                bucket="customer-documents"
                folder={customerId}
                title="Documents"
                refreshTrigger={refreshTrigger}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Upload documents for {customer.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                bucket="customer-documents"
                folder={customerId}
                fileTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]}
                maxSizeMB={10}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

