import type { ReactNode } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import type { FieldPath, FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
  children: (field: { value: unknown; onChange: (value: unknown) => void; onBlur: () => void }) => ReactNode
  className?: string
}

export function FormField<T extends FieldValues>({
  name,
  label,
  description,
  required,
  children,
  className,
}: FormFieldProps<T>) {
  const { control, formState: { errors } } = useFormContext<T>()
  const error = errors[name]?.message as string | undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => children(field) as React.ReactElement}
      />
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
