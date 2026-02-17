import { useCallback, useState, useRef } from 'react'
import { Upload, File, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  accept?: string[]
  maxSize?: number // in bytes
  className?: string
}

export function UploadDropzone({
  onFileSelect,
  disabled = false,
  accept,
  maxSize,
  className,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0)
      const fileMB = (file.size / (1024 * 1024)).toFixed(2)
      return `File size (${fileMB} MB) exceeds maximum allowed size (${maxMB} MB)`
    }

    if (accept && accept.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type
      const isAccepted = accept.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase()
        }
        if (type.includes('*')) {
          const [base] = type.split('*')
          return mimeType.startsWith(base)
        }
        return mimeType === type
      })
      if (!isAccepted) {
        return `File type not allowed. Accepted types: ${accept.join(', ')}`
      }
    }

    return null
  }, [accept, maxSize])

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled, handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleClearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-colors',
        isDragActive && !disabled
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept={accept?.join(',')}
        disabled={disabled}
      />

      <div className="p-8 text-center">
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <File className="h-10 w-10 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFile}
              disabled={disabled}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload
              className={cn(
                'mx-auto h-12 w-12 mb-4 transition-colors',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <p className="text-lg font-medium text-foreground mb-1">
              {isDragActive ? 'Drop file here' : 'Drag and drop a file'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button
              variant="outline"
              onClick={handleBrowseClick}
              disabled={disabled}
            >
              Browse Files
            </Button>
            {maxSize && (
              <p className="text-xs text-muted-foreground mt-2">
                Maximum file size: {formatSize(maxSize)}
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="px-4 pb-4">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
