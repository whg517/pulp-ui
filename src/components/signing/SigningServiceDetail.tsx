import { Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSigningService } from '@/hooks/useApi'
import type { PulpSigningService } from '@/types/pulp'
import { formatDistanceToNow } from 'date-fns'

interface SigningServiceDetailProps {
  signingService: PulpSigningService
  trigger?: React.ReactNode
}

export function SigningServiceDetail({ signingService, trigger }: SigningServiceDetailProps) {
  const { data: detailedService, isLoading } = useSigningService(signingService.pulp_href)

  const service = detailedService || signingService

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Signing Service: {service.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                </div>
                <div className="col-span-2 font-medium">{service.name}</div>

                <div>
                  <span className="text-muted-foreground">Created:</span>
                </div>
                <div className="col-span-2">
                  {formatDistanceToNow(new Date(service.pulp_created), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Key Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Key Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Public Key Fingerprint:</span>
                  <div className="mt-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                    {service.pubkey_fingerprint}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Public Key:</span>
                  <div className="mt-1 p-3 bg-muted rounded-md font-mono text-xs break-all max-h-48 overflow-y-auto">
                    {service.public_key || 'No public key available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Reference
              </h3>
              <div className="text-sm">
                <span className="text-muted-foreground">Pulp HREF:</span>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {service.pulp_href}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
