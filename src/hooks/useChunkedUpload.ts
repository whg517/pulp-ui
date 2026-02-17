import { useState, useCallback, useRef } from 'react'
import { pulpApi } from '@/api/client'
import type { PulpUpload } from '@/types/pulp'
import type { FileUploadState, ChunkUploadProgress, ChunkUploadResult } from '@/types/upload'
import { CHUNK_SIZE } from '@/types/upload'

interface UseChunkedUploadOptions {
  onSuccess?: (artifactHref: string) => void
  onError?: (error: string) => void
  /** Maximum retry attempts for failed chunks (default: 3) */
  maxRetries?: number
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryBaseDelay?: number
}

interface UseChunkedUploadReturn {
  uploadState: FileUploadState | null
  startUpload: (file: File) => Promise<void>
  uploadAllChunks: () => Promise<void>
  commitUpload: () => Promise<string | null>
  cancelUpload: () => Promise<void>
  resetState: () => void
  isUploading: boolean
}

// Calculate SHA256 hash using Web Crypto API
async function calculateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useChunkedUpload(options: UseChunkedUploadOptions = {}): UseChunkedUploadReturn {
  const { onSuccess, onError, maxRetries = 3, retryBaseDelay = 1000 } = options
  const [uploadState, setUploadState] = useState<FileUploadState | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetState = useCallback(() => {
    setUploadState(null)
    setIsUploading(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const startUpload = useCallback(async (file: File) => {
    resetState()
    setIsUploading(true)

    // Calculate number of chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // Initialize chunk states
    const chunks: ChunkUploadProgress[] = Array.from({ length: totalChunks }, (_, i) => ({
      chunkIndex: i,
      uploaded: 0,
      total: Math.min(CHUNK_SIZE, file.size - i * CHUNK_SIZE),
      percentage: 0,
      status: 'pending',
    }))

    // Set initial state
    setUploadState({
      file,
      uploadHref: null,
      sha256: null,
      chunks,
      overallProgress: 0,
      status: 'hashing',
      error: null,
    })

    try {
      // Calculate SHA256
      const sha256 = await calculateSHA256(file)

      // Create upload session
      const uploadResponse = await pulpApi.createUpload({
        size: file.size,
        chunk_size: CHUNK_SIZE,
      }) as PulpUpload

      const uploadHref = uploadResponse.pulp_href

      setUploadState(prev => prev ? {
        ...prev,
        uploadHref,
        sha256,
        status: 'uploading',
      } : null)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start upload'
      setUploadState(prev => prev ? {
        ...prev,
        status: 'failed',
        error: errorMessage,
      } : null)
      setIsUploading(false)
      onError?.(errorMessage)
    }
  }, [resetState, onError])

  const uploadChunk = useCallback(async (chunkIndex: number): Promise<ChunkUploadResult> => {
    if (!uploadState?.file || !uploadState.uploadHref) {
      return { success: false, error: 'No file or upload session' }
    }

    const file = uploadState.file
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    const chunkSize = end - start

    const contentRange = `bytes ${start}-${end - 1}/${file.size}`

    // Retry logic with exponential backoff
    let lastError: string = 'Chunk upload failed'

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update chunk status to uploading
        setUploadState(prev => {
          if (!prev) return null
          const newChunks = [...prev.chunks]
          newChunks[chunkIndex] = { ...newChunks[chunkIndex], status: 'uploading' }
          return { ...prev, chunks: newChunks }
        })

        const response = await pulpApi.updateUploadChunk(
          uploadState.uploadHref,
          chunkIndex,
          contentRange,
          chunk
        )

        if (!response.ok) {
          // Try to extract error details from response
          let errorDetail = `Upload failed with status ${response.status}`
          try {
            const errorData = await response.json()
            errorDetail = errorData.detail || errorDetail
          } catch { /* ignore parse errors */ }
          throw new Error(errorDetail)
        }

        // Update chunk status to completed
        setUploadState(prev => {
          if (!prev) return null
          const newChunks = [...prev.chunks]
          newChunks[chunkIndex] = {
            ...newChunks[chunkIndex],
            uploaded: chunkSize,
            percentage: 100,
            status: 'completed',
          }

          // Calculate overall progress
          const totalUploaded = newChunks.reduce((sum, c) => sum + c.uploaded, 0)
          const overallProgress = Math.round((totalUploaded / file.size) * 100)

          return { ...prev, chunks: newChunks, overallProgress }
        })

        return { success: true }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Chunk upload failed'

        // If not the last attempt, wait with exponential backoff before retrying
        if (attempt < maxRetries) {
          const delay = retryBaseDelay * Math.pow(2, attempt)
          await sleep(delay)
        }
      }
    }

    // All retries failed
    setUploadState(prev => {
      if (!prev) return null
      const newChunks = [...prev.chunks]
      newChunks[chunkIndex] = { ...newChunks[chunkIndex], status: 'failed' }
      return { ...prev, chunks: newChunks }
    })

    return { success: false, error: lastError }
  }, [uploadState, maxRetries, retryBaseDelay])

  const uploadAllChunks = useCallback(async () => {
    if (!uploadState?.chunks) return

    for (let i = 0; i < uploadState.chunks.length; i++) {
      if (uploadState.chunks[i].status !== 'completed') {
        const result = await uploadChunk(i)
        if (!result.success) {
          setUploadState(prev => prev ? {
            ...prev,
            status: 'failed',
            error: result.error || 'Upload failed',
          } : null)
          setIsUploading(false)
          onError?.(result.error || 'Upload failed')
          return
        }
      }
    }
  }, [uploadState, uploadChunk, onError])

  const commitUpload = useCallback(async (): Promise<string | null> => {
    if (!uploadState?.uploadHref || !uploadState.sha256) {
      return null
    }

    setUploadState(prev => prev ? { ...prev, status: 'committing' } : null)

    try {
      const result = await pulpApi.commitUpload(uploadState.uploadHref, uploadState.sha256) as { pulp_href?: string; artifact?: string }

      setUploadState(prev => prev ? {
        ...prev,
        status: 'completed',
        overallProgress: 100,
      } : null)

      setIsUploading(false)
      const artifactHref = result.pulp_href || result.artifact || ''
      onSuccess?.(artifactHref)

      return artifactHref || null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to commit upload'
      setUploadState(prev => prev ? {
        ...prev,
        status: 'failed',
        error: errorMessage,
      } : null)
      setIsUploading(false)
      onError?.(errorMessage)
      return null
    }
  }, [uploadState, onSuccess, onError])

  const cancelUpload = useCallback(async () => {
    if (uploadState?.uploadHref) {
      try {
        await pulpApi.deleteUpload(uploadState.uploadHref)
      } catch {
        // Ignore deletion errors on cancel
      }
    }
    resetState()
  }, [uploadState, resetState])

  return {
    uploadState,
    startUpload,
    uploadAllChunks,
    commitUpload,
    cancelUpload,
    resetState,
    isUploading,
  }
}
