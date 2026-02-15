import type { FieldPath, FieldValues } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FormField } from './FormField'

interface FormSwitchProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
}

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
}: FormSwitchProps<T>) {
  return (
    <FormField<T>
      name={name}
      label=""
      description={description}
    >
      {({ value, onChange }) => (
        <div className="flex items-center justify-between">
          <Label htmlFor={name} className="cursor-pointer">
            {label}
          </Label>
          <Switch
            id={name}
            checked={value as boolean}
            onCheckedChange={onChange}
            disabled={disabled}
          />
        </div>
      )}
    </FormField>
  )
}
