import { useCallback, useState, useEffect } from 'react'
import { Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadDropzone } from './UploadDropzone'
import { UploadProgress } from './UploadProgress'
import { useChunkedUpload } from '@/hooks/useChunkedUpload'

interface FileUploaderProps {
  onUploadComplete?: (artifactHref: string) => void
  onUploadError?: (error: string) => void
  accept?: string[]
  maxSize?: number
  className?: string
}

export function FileUploader({
  onUploadComplete,
  onUploadError,
  accept,
  maxSize,
  className,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    uploadState,
    startUpload,
    uploadAllChunks,
    commitUpload,
    cancelUpload,
    resetState,
    isUploading,
  } = useChunkedUpload({
    onSuccess: (artifactHref) => {
      onUploadComplete?.(artifactHref)
    },
    onError: (error) => {
      onUploadError?.(error)
    },
  })

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    startUpload(file)
  }, [startUpload])

  const handleUpload = useCallback(async () => {
    if (!uploadState) return

    await uploadAllChunks()
    const artifactHref = await commitUpload()
    if (artifactHref) {
      setIsProcessing(false)
    }
  }, [uploadState, uploadAllChunks, commitUpload])

  const handleCancel = useCallback(async () => {
    await cancelUpload()
    setSelectedFile(null)
    setIsProcessing(false)
  }, [cancelUpload])

  const handleReset = useCallback(() => {
    resetState()
    setSelectedFile(null)
    setIsProcessing(false)
  }, [resetState])

  // Auto-start upload when hashing is complete
  useEffect(() => {
    if (uploadState?.status === 'uploading' && !isUploading) {
      handleUpload()
    }
  }, [uploadState?.status, isUploading, handleUpload])

  const isCompleted = uploadState?.status === 'completed'
  const isFailed = uploadState?.status === 'failed'
  const isWorking = isProcessing && (uploadState?.status === 'hashing' || uploadState?.status === 'uploading' || uploadState?.status === 'committing')

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File
        </CardTitle>
        <CardDescription>
          Upload a file to create an artifact in Pulp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!uploadState ? (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            accept={accept}
            maxSize={maxSize}
            disabled={isProcessing}
          />
        ) : (
          <>
            <UploadProgress uploadState={uploadState} />

            <div className="flex justify-end gap-2">
              {isFailed && (
                <>
                  <Button variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                  <Button onClick={() => startUpload(selectedFile!)}>
                    Retry
                  </Button>
                </>
              )}

              {isCompleted && (
                <>
                  <Button variant="outline" onClick={handleReset}>
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => {
                      if (uploadState.uploadHref) {
                        onUploadComplete?.(uploadState.uploadHref)
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                </>
              )}

              {isWorking && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}

        {/* Help text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Files are uploaded in 2MB chunks for reliability.</p>
          <p>The SHA256 checksum is calculated before upload to ensure file integrity.</p>
        </div>
      </CardContent>
    </Card>
  )
}
