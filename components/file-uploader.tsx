"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, FileIcon, CheckCircle, AlertCircle } from "lucide-react"
import { uploadFile } from "@/lib/utils/file-storage"

interface FileUploaderProps {
  bucket: string
  folder?: string
  fileTypes?: string[]
  maxSizeMB?: number
  onUploadComplete?: (fileUrl: string, filePath: string) => void
  onUploadError?: (error: Error) => void
}

export function FileUploader({
  bucket,
  folder,
  fileTypes = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  maxSizeMB = 5,
  onUploadComplete,
  onUploadError,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validate file type
      const fileExtension = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`
      if (!fileTypes.includes(fileExtension)) {
        setUploadError(`Invalid file type. Allowed types: ${fileTypes.join(", ")}`)
        setFile(null)
        return
      }

      // Validate file size
      const fileSizeMB = selectedFile.size / (1024 * 1024)
      if (fileSizeMB > maxSizeMB) {
        setUploadError(`File size exceeds the maximum allowed size of ${maxSizeMB}MB`)
        setFile(null)
        return
      }

      setFile(selectedFile)
      setUploadError(null)
      setUploadSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      const result = await uploadFile(file, {
        bucket,
        folder,
        fileTypes,
        maxSizeMB,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadSuccess(true)

      if (onUploadComplete && result) {
        onUploadComplete(result.url, result.path)
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })
    } catch (error: any) {
      setUploadError(error.message || "An error occurred during upload")
      setUploadProgress(0)

      if (onUploadError) {
        onUploadError(error)
      }

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadError(null)
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              accept={fileTypes.join(",")}
            />
            <p className="text-xs text-muted-foreground">
              Allowed file types: {fileTypes.join(", ")} (Max size: {maxSizeMB}MB)
            </p>
          </div>

          {file && (
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileIcon className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isUploading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {uploadError && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md flex items-center space-x-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">File uploaded successfully!</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || isUploading || uploadSuccess} className="w-full">
            {isUploading ? "Uploading..." : "Upload File"}
            {!isUploading && <Upload className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

