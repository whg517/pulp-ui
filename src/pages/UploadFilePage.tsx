import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/uploads'
import { toast } from 'sonner'

export function UploadFilePage() {
  const navigate = useNavigate()

  const handleUploadComplete = (_artifactHref: string) => {
    toast.success('Upload complete', {
      description: 'File has been successfully uploaded as an artifact.',
    })
    // Navigate to uploads list or artifacts
    navigate('/uploads')
  }

  const handleUploadError = (error: string) => {
    toast.error('Upload failed', {
      description: error,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/uploads')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload File</h1>
          <p className="text-muted-foreground">
            Upload a file to create an artifact in Pulp
          </p>
        </div>
      </div>

      {/* Upload component */}
      <div className="max-w-2xl">
        <FileUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          maxSize={10 * 1024 * 1024 * 1024} // 10GB max
        />
      </div>
    </div>
  )
}
