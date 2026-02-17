import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LabelsEditorProps {
  value: Record<string, string>
  onChange: (labels: Record<string, string>) => void
  disabled?: boolean
  className?: string
}

export function LabelsEditor({ value, onChange, disabled, className }: LabelsEditorProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [duplicateKeyError, setDuplicateKeyError] = useState<string | null>(null)

  const handleAddLabel = () => {
    const trimmedKey = newKey.trim()
    const trimmedValue = newValue.trim()

    if (!trimmedKey) return

    if (Object.prototype.hasOwnProperty.call(value, trimmedKey)) {
      setDuplicateKeyError(`Key "${trimmedKey}" already exists`)
      return
    }

    onChange({
      ...value,
      [trimmedKey]: trimmedValue,
    })

    setNewKey('')
    setNewValue('')
    setDuplicateKeyError(null)
  }

  const handleRemoveLabel = (keyToRemove: string) => {
    const newLabels: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k !== keyToRemove) {
        newLabels[k] = v
      }
    }
    onChange(newLabels)
  }

  const handleStartEdit = (key: string) => {
    setEditingKey(key)
    setEditValue(value[key])
  }

  const handleSaveEdit = (key: string) => {
    if (editValue !== value[key]) {
      onChange({
        ...value,
        [key]: editValue.trim(),
      })
    }
    setEditingKey(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLabel()
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit(key)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleKeyChange = (key: string) => {
    setNewKey(key)
    if (duplicateKeyError) {
      setDuplicateKeyError(null)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Existing labels */}
      {Object.entries(value).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(value).map(([key, val]) => (
            <Badge
              key={key}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1"
            >
              <span className="font-medium">{key}</span>
              {editingKey === key ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, key)}
                  onBlur={() => handleSaveEdit(key)}
                  className="h-5 w-20 px-1 text-xs"
                  autoFocus
                  disabled={disabled}
                />
              ) : (
                <>
                  {val && (
                    <>
                      <span className="text-muted-foreground">:</span>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => !disabled && handleStartEdit(key)}
                        title="Click to edit"
                      >
                        {val.length > 15 ? `${val.slice(0, 15)}...` : val}
                      </span>
                    </>
                  )}
                </>
              )}
              {!disabled && editingKey !== key && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={() => handleRemoveLabel(key)}
                  title="Remove label"
                >
                  <span className="sr-only">Remove</span>
                  &times;
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Add new label */}
      {!disabled && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Key"
              value={newKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={disabled}
            />
            <Input
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLabel}
              disabled={!newKey.trim() || disabled}
            >
              Add
            </Button>
          </div>
          {duplicateKeyError && (
            <p className="text-xs text-destructive">{duplicateKeyError}</p>
          )}
        </div>
      )}
    </div>
  )
}
