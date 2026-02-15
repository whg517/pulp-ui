import type { FieldPath, FieldValues } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from './FormField'

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  description,
  required,
  options,
  placeholder,
  disabled,
}: FormSelectProps<T>) {
  return (
    <FormField<T>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ value, onChange, onBlur }) => (
        <Select
          value={value as string}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger onBlur={onBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}
