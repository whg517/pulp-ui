import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, RefreshCw, ExternalLink, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useExports } from '@/hooks/useApi'
import { ExportCreateDialog } from '@/components/exports'
import { PulpApiError } from '@/api/client'
import type { PulpExport } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

// Helper function to get user-friendly error message
function getErrorMessage(error: unknown, resourceName: string): string {
  if (error instanceof PulpApiError) {
    switch (error.status) {
      case 404:
        return `${resourceName} API not available. This feature may require specific Pulp plugins.`
      case 401:
        return 'Authentication required. Please log in again.'
      case 403:
        return 'You do not have permission to access this resource.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.data.detail || `Failed to load ${resourceName.toLowerCase()} (${error.status})`
    }
  }
  return `Failed to load ${resourceName.toLowerCase()}. Please try again.`
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function ExportsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedExport, setSelectedExport] = useState<PulpExport | null>(null)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useExports({
    offset: (page - 1) * pageSize,
    limit: pageSize,
  })

  const isLoadingFiles = false

  const files = selectedExport?.output_file_info
    ? Object.entries(selectedExport.output_file_info).map(([filename, info]) => ({
        filename,
        sha256: info.sha256,
        size: info.size,
      }))
    : []

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exports</h1>
          <p className="text-muted-foreground">Manage Pulp content exports</p>
        </div>
        <ExportCreateDialog />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading exports</AlertTitle>
              <AlertDescription>
                {getErrorMessage(error, 'Exports')}
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          ) : data?.results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No exports found matching your search' : 'No exports found'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Version</TableHead>
                  <TableHead>End Version</TableHead>
                  <TableHead>Chunk Size</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((exp: PulpExport) => (
                  <TableRow key={exp.pulp_href}>
                    <TableCell className="font-mono text-sm">
                      {exp.params?.start_repository_version?.split('/').slice(-2).join('/') || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {exp.params?.end_repository_version?.split('/').slice(-2).join('/') || '-'}
                    </TableCell>
                    <TableCell>
                      {exp.params?.chunk_size
                        ? formatBytes(parseInt(exp.params.chunk_size))
                        : 'Single file'}
                    </TableCell>
                    <TableCell>
                      {exp.output_file_info
                        ? `${Object.keys(exp.output_file_info).length} file(s)`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {exp.task ? (
                        <Link
                          to={`/tasks/${encodeURIComponent(exp.task)}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View Task
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(exp.pulp_created), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {exp.output_file_info && Object.keys(exp.output_file_info).length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExport(exp)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Files
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.count || 0)} of {data?.count || 0} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Files Dialog */}
      <Dialog open={!!selectedExport} onOpenChange={() => setSelectedExport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Files</DialogTitle>
            <DialogDescription>
              Files generated by this export operation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingFiles ? (
              <Skeleton className="h-32 w-full" />
            ) : files.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>SHA256</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.filename}>
                      <TableCell className="font-mono text-sm">
                        {file.filename}
                      </TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {file.sha256}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No files available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
