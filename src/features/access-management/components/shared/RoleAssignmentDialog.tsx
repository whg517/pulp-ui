import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

interface RoleAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUser?: string
  targetGroup?: string
  onSuccess?: () => void
}

type AssignmentState =
  | { step: 1 }
  | { step: 2; resourceType: string }
  | { step: 3; resourceType: string; selectedObjects: string[] }
  | { step: 4; resourceType: string; selectedObjects: string[]; selectedRole: string }

export function RoleAssignmentDialog({
  open,
  onOpenChange,
  targetUser,
  targetGroup,
  onSuccess,
}: RoleAssignmentDialogProps) {
  const [state, setState] = useState<AssignmentState>({ step: 1 })
  const [resourceType, setResourceType] = useState<string>('')
  const [selectedObjects, setSelectedObjects] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = () => {
    if (state.step === 1 && resourceType) {
      setState({ step: 2, resourceType })
    } else if (state.step === 2 && selectedObjects.length > 0) {
      setState({ step: 3, resourceType, selectedObjects })
    } else if (state.step === 3 && selectedRole) {
      setState({ step: 4, resourceType, selectedObjects, selectedRole })
    }
  }

  const handleBack = () => {
    if (state.step === 2) {
      setState({ step: 1 })
    } else if (state.step === 3) {
      setState({ step: 2, resourceType: state.resourceType })
    } else if (state.step === 4) {
      setState({ step: 3, resourceType: state.resourceType, selectedObjects: state.selectedObjects })
    }
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to assign role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDialog = () => {
    setState({ step: 1 })
    setResourceType('')
    setSelectedObjects([])
    setSelectedRole('')
  }

  const closeDialog = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
        </DialogHeader>
        
        {state.step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Select Resource Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={resourceType === 'repositories' ? 'default' : 'outline'}
                  onClick={() => setResourceType('repositories')}
                >
                  Repositories
                </Button>
                <Button
                  variant={resourceType === 'remotes' ? 'default' : 'outline'}
                  onClick={() => setResourceType('remotes')}
                >
                  Remotes
                </Button>
                <Button
                  variant={resourceType === 'distributions' ? 'default' : 'outline'}
                  onClick={() => setResourceType('distributions')}
                >
                  Distributions
                </Button>
                <Button
                  variant={resourceType === 'publications' ? 'default' : 'outline'}
                  onClick={() => setResourceType('publications')}
                >
                  Publications
                </Button>
              </div>
            </div>
          </div>
        )}

        {state.step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Select Objects</Label>
              <Input placeholder="Search..." className="mt-2" />
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {selectedObjects.length === 0 && (
                  <p className="text-muted text-center py-4">Select objects to add</p>
                )}
              </div>
            </div>
          </div>
        )}

        {state.step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Select Role</Label>
              <Input placeholder="Search roles..." className="mt-2" />
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">Repository Owner</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedRole('repo-owner')}
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.step === 4 && (
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 rounded p-4">
              <p className="font-medium mb-2">⚠️ The following changes will be made:</p>
              <div className="space-y-2">
                <p><strong>Target:</strong> {targetUser || targetGroup}</p>
                <p><strong>Role:</strong> {selectedRole}</p>
                <p><strong>Objects:</strong> {selectedObjects.length} object(s)</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {state.step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {state.step < 4 ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Confirm Assign'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}