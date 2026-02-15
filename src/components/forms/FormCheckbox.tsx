import type { FieldPath, FieldValues } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FormField } from './FormField'

interface FormCheckboxProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
}: FormCheckboxProps<T>) {
  return (
    <FormField<T>
      name={name}
      label=""
      description={description}
    >
      {({ value, onChange }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={name}
            checked={value as boolean}
            onCheckedChange={onChange}
            disabled={disabled}
          />
          <Label htmlFor={name} className="font-normal cursor-pointer">
            {label}
          </Label>
        </div>
      )}
    </FormField>
  )
}
