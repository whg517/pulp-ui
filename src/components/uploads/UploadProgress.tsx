import { Check, X, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { FileUploadState } from '@/types/upload'

interface UploadProgressProps {
  uploadState: FileUploadState
  className?: string
}

export function UploadProgress({ uploadState, className }: UploadProgressProps) {
  const { file, chunks, overallProgress, status, error } = uploadState

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Preparing...'
      case 'hashing':
        return 'Calculating file checksum...'
      case 'uploading':
        return `Uploading... ${overallProgress}%`
      case 'committing':
        return 'Finalizing upload...'
      case 'completed':
        return 'Upload complete!'
      case 'failed':
        return 'Upload failed'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-destructive'
      default:
        return 'text-foreground'
    }
  }

  const completedChunks = chunks.filter(c => c.status === 'completed').length
  const totalChunks = chunks.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* File info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
        </div>
        <div className={cn('text-sm font-medium', getStatusColor())}>
          {status === 'hashing' || status === 'committing' ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {getStatusText()}
            </span>
          ) : status === 'completed' ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {getStatusText()}
            </span>
          ) : status === 'failed' ? (
            <span className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {getStatusText()}
            </span>
          ) : (
            getStatusText()
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-2">
        <Progress value={overallProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedChunks} of {totalChunks} chunks</span>
          <span>{overallProgress}%</span>
        </div>
      </div>

      {/* Chunk status grid */}
      {chunks.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Chunk Status</p>
          <div className="flex flex-wrap gap-1">
            {chunks.map((chunk) => (
              <div
                key={chunk.chunkIndex}
                className={cn(
                  'w-4 h-4 rounded-sm transition-colors',
                  chunk.status === 'pending' && 'bg-muted',
                  chunk.status === 'uploading' && 'bg-blue-500 animate-pulse',
                  chunk.status === 'completed' && 'bg-green-500',
                  chunk.status === 'failed' && 'bg-destructive'
                )}
                title={`Chunk ${chunk.chunkIndex + 1}: ${chunk.status}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
