import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CronEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const PRESETS = [
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily (midnight)', value: '0 0 * * *' },
  { label: 'Daily (noon)', value: '0 12 * * *' },
  { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
  { label: 'Every minute', value: '* * * * *' },
]

const FIELD_NAMES = ['minute', 'hour', 'day of month', 'month', 'day of week']
const FIELD_RANGES = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 6 },
]

function parseCronExpression(cron: string): string[] {
  const parts = cron.trim().split(/\s+/)
  // Support 5 or 6 field cron (6th field is seconds, which we ignore)
  if (parts.length < 5) {
    return ['*', '*', '*', '*', '*']
  }
  return parts.slice(0, 5)
}

function buildCronExpression(fields: string[]): string {
  return fields.join(' ')
}

function describeCron(cron: string): string {
  const parts = parseCronExpression(cron)
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  // Simple description logic
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute'
  }
  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every hour on the hour'
  }
  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every day at midnight'
  }
  if (minute === '0' && hour === '12' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every day at noon'
  }
  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '0') {
    return 'Every Sunday at midnight'
  }
  if (minute === '0' && hour === '0' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
    return 'On the 1st of every month at midnight'
  }

  // Generic description
  const descriptions: string[] = []
  if (minute !== '*') descriptions.push(`minute ${minute}`)
  if (hour !== '*') descriptions.push(`hour ${hour}`)
  if (dayOfMonth !== '*') descriptions.push(`day ${dayOfMonth}`)
  if (month !== '*') descriptions.push(`month ${month}`)
  if (dayOfWeek !== '*') descriptions.push(`day of week ${dayOfWeek}`)

  if (descriptions.length === 0) {
    return 'Custom schedule'
  }
  return `At ${descriptions.join(', ')}`
}

function validateField(value: string, min: number, max: number): boolean {
  if (value === '*') return true
  if (value.includes('/')) {
    const [base, step] = value.split('/')
    const stepNum = parseInt(step, 10)
    if (isNaN(stepNum) || stepNum < 1) return false
    if (base === '*') return true
    const baseNum = parseInt(base, 10)
    if (isNaN(baseNum)) return false
    return baseNum >= min && baseNum <= max
  }
  if (value.includes('-')) {
    const [start, end] = value.split('-').map(v => parseInt(v, 10))
    if (isNaN(start) || isNaN(end)) return false
    return start >= min && start <= max && end >= min && end <= max && start <= end
  }
  if (value.includes(',')) {
    return value.split(',').every(v => {
      const num = parseInt(v.trim(), 10)
      return !isNaN(num) && num >= min && num <= max
    })
  }
  const num = parseInt(value, 10)
  if (isNaN(num)) return false
  return num >= min && num <= max
}

function validateCron(cron: string): { valid: boolean; error?: string } {
  const parts = parseCronExpression(cron)
  if (parts.length !== 5) {
    return { valid: false, error: 'Invalid cron expression' }
  }
  for (let i = 0; i < 5; i++) {
    if (!validateField(parts[i], FIELD_RANGES[i].min, FIELD_RANGES[i].max)) {
      return { valid: false, error: `Invalid ${FIELD_NAMES[i]}: ${parts[i]}` }
    }
  }
  return { valid: true }
}

export function CronEditor({ value, onChange, disabled, className }: CronEditorProps) {
  const [mode, setMode] = useState<'preset' | 'custom' | 'fields'>('preset')
  const [fields, setFields] = useState<string[]>(parseCronExpression(value))
  const [customValue, setCustomValue] = useState(value)

  useEffect(() => {
    setFields(parseCronExpression(value))
    setCustomValue(value)
  }, [value])

  const handlePresetSelect = (preset: string) => {
    onChange(preset)
    setFields(parseCronExpression(preset))
    setCustomValue(preset)
  }

  const handleFieldChange = (index: number, fieldValue: string) => {
    const newFields = [...fields]
    newFields[index] = fieldValue
    setFields(newFields)
    const newCron = buildCronExpression(newFields)
    setCustomValue(newCron)
    onChange(newCron)
  }

  const handleCustomChange = (newValue: string) => {
    setCustomValue(newValue)
    const validation = validateCron(newValue)
    if (validation.valid) {
      setFields(parseCronExpression(newValue))
      onChange(newValue)
    }
  }

  const validation = validateCron(customValue)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'preset' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('preset')}
          disabled={disabled}
        >
          Presets
        </Button>
        <Button
          type="button"
          variant={mode === 'fields' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('fields')}
          disabled={disabled}
        >
          Fields
        </Button>
        <Button
          type="button"
          variant={mode === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('custom')}
          disabled={disabled}
        >
          Custom
        </Button>
      </div>

      {/* Preset Mode */}
      {mode === 'preset' && (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant={value === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetSelect(preset.value)}
              disabled={disabled}
              className="justify-start"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {/* Fields Mode */}
      {mode === 'fields' && (
        <div className="grid grid-cols-5 gap-2">
          {fields.map((field, index) => (
            <div key={FIELD_NAMES[index]} className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {FIELD_NAMES[index].charAt(0).toUpperCase() + FIELD_NAMES[index].slice(1).substring(0, 2)}
              </Label>
              <Input
                value={field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                placeholder={FIELD_RANGES[index].min === 0 ? '0-59' : '1-31'}
                disabled={disabled}
                className="h-9 text-center"
              />
              <p className="text-xs text-muted-foreground">
                {FIELD_RANGES[index].min}-{FIELD_RANGES[index].max}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Custom Mode */}
      {mode === 'custom' && (
        <div className="space-y-2">
          <Label>Cron Expression</Label>
          <Input
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="* * * * *"
            disabled={disabled}
            className={!validation.valid ? 'border-destructive' : ''}
          />
          {!validation.valid && (
            <p className="text-xs text-destructive">{validation.error}</p>
          )}
        </div>
      )}

      {/* Current Value Display */}
      <div className="rounded-md bg-muted p-3 space-y-1">
        <p className="text-sm font-mono">{value || '* * * * *'}</p>
        <p className="text-sm text-muted-foreground">{describeCron(value || '* * * * *')}</p>
      </div>
    </div>
  )
}
