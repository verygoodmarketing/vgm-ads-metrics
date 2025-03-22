import { createClientSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

type FileUploadOptions = {
  bucket: string
  folder?: string
  fileTypes?: string[]
  maxSizeMB?: number
}

export async function uploadFile(
  file: File,
  options: FileUploadOptions,
): Promise<{ url: string; path: string } | null> {
  const supabase = createClientSupabaseClient()

  // Validate file type if fileTypes is provided
  if (options.fileTypes && options.fileTypes.length > 0) {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (!fileExtension || !options.fileTypes.includes(`.${fileExtension}`)) {
      throw new Error(`Invalid file type. Allowed types: ${options.fileTypes.join(", ")}`)
    }
  }

  // Validate file size if maxSizeMB is provided
  if (options.maxSizeMB) {
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > options.maxSizeMB) {
      throw new Error(`File size exceeds the maximum allowed size of ${options.maxSizeMB}MB`)
    }
  }

  // Generate a unique file name to prevent collisions
  const fileExtension = file.name.split(".").pop()
  const fileName = `${uuidv4()}.${fileExtension}`

  // Create the file path
  const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

  // Upload the file
  const { data, error } = await supabase.storage.from(options.bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Error uploading file:", error)
    throw error
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(options.bucket).getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
  }
}

export async function deleteFile(path: string, bucket: string): Promise<boolean> {
  const supabase = createClientSupabaseClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error("Error deleting file:", error)
    throw error
  }

  return true
}

export async function getFileUrl(path: string, bucket: string): Promise<string> {
  const supabase = createClientSupabaseClient()

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

export async function listFiles(
  bucket: string,
  folder?: string,
): Promise<{ name: string; url: string; path: string }[]> {
  const supabase = createClientSupabaseClient()

  const { data, error } = await supabase.storage.from(bucket).list(folder || "")

  if (error) {
    console.error("Error listing files:", error)
    throw error
  }

  return data.map((file) => {
    const path = folder ? `${folder}/${file.name}` : file.name
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)

    return {
      name: file.name,
      url: publicUrl,
      path,
    }
  })
}

