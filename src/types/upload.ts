// Upload-specific types for file upload functionality

export interface ChunkUploadProgress {
  chunkIndex: number
  uploaded: number
  total: number
  percentage: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
}

export interface FileUploadState {
  file: File
  uploadHref: string | null
  sha256: string | null
  chunks: ChunkUploadProgress[]
  overallProgress: number
  status: 'pending' | 'hashing' | 'uploading' | 'committing' | 'completed' | 'failed'
  error: string | null
}

export interface UploadCommitOptions {
  sha256: string
  repository?: string
  relative_path?: string
}

export interface ChunkUploadResult {
  success: boolean
  error?: string
}

// Constants
export const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB chunks
