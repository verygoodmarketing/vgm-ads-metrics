"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { diagnoseSupabaseConnection } from "@/lib/supabase-debug"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null)

  // Check network connectivity
  useEffect(() => {
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine)
    }
    
    checkNetwork()
    window.addEventListener('online', checkNetwork)
    window.addEventListener('offline', checkNetwork)
    
    return () => {
      window.removeEventListener('online', checkNetwork)
      window.removeEventListener('offline', checkNetwork)
    }
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    setResults(null)
    
    try {
      const diagnosticResults = await diagnoseSupabaseConnection()
      setResults(diagnosticResults)
    } catch (error) {
      console.error("Error running diagnostics:", error)
      setResults({
        success: false,
        message: "Error running diagnostics",
        error: error
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Supabase Connection Diagnostics</CardTitle>
          <CardDescription>
            Use this tool to diagnose connection issues with Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="font-medium">Network Status:</div>
            {networkStatus === null ? (
              <span>Checking...</span>
            ) : networkStatus ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Disconnected</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="font-medium">Environment:</div>
            <span>{process.env.NODE_ENV}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="font-medium">Supabase URL:</div>
            <span className="text-xs font-mono">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 12)}...` : 
                "Not set"}
            </span>
          </div>

          <div className="border-t pt-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Diagnostics
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearLocalStorage}
            >
              Clear Local Storage
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Running diagnostics...</p>
            </div>
          )}

          {results && (
            <div className="mt-4">
              <Alert variant={results.success ? "default" : "destructive"}>
                {results.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{results.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{results.message}</AlertDescription>
              </Alert>

              <div className="mt-4 bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Diagnostic Details:</h3>
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Back to Login
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
