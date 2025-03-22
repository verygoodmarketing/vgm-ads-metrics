"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FileIcon, Trash2, Download, Eye, Loader2 } from "lucide-react"
import { listFiles, deleteFile } from "@/lib/utils/file-storage"
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

interface FileViewerProps {
  bucket: string
  folder?: string
  title?: string
  onFileDelete?: (path: string) => void
  allowDelete?: boolean
  refreshTrigger?: number
}

export function FileViewer({
  bucket,
  folder,
  title = "Files",
  onFileDelete,
  allowDelete = true,
  refreshTrigger = 0,
}: FileViewerProps) {
  const [files, setFiles] = useState<{ name: string; url: string; path: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const fileList = await listFiles(bucket, folder)
      setFiles(fileList)
    } catch (error: any) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [bucket, folder, refreshTrigger])

  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    setIsDeleting(true)
    try {
      await deleteFile(fileToDelete, bucket)

      setFiles(files.filter((file) => file.path !== fileToDelete))

      if (onFileDelete) {
        onFileDelete(fileToDelete)
      }

      toast({
        title: "File deleted",
        description: "The file has been successfully deleted.",
      })
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setFileToDelete(null)
    }
  }

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FileIcon className="h-6 w-6 text-red-500" />
      case "doc":
      case "docx":
        return <FileIcon className="h-6 w-6 text-blue-500" />
      case "xls":
      case "xlsx":
        return <FileIcon className="h-6 w-6 text-green-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Eye className="h-6 w-6 text-purple-500" />
      default:
        return <FileIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const isImage = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif"].includes(extension || "")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No files found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.path} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center space-x-3">
                  {getFileTypeIcon(file.name)}
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isImage(file.name) ? (
                    <Button variant="outline" size="icon" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="icon" asChild>
                      <a href={file.url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  {allowDelete && (
                    <Button variant="outline" size="icon" onClick={() => setFileToDelete(file.path)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFile}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

