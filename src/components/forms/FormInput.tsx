import type { FieldPath, FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import type { InputProps } from '@/components/ui/input'
import { FormField } from './FormField'

interface FormInputProps<T extends FieldValues> extends Omit<InputProps, 'name'> {
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  description,
  required,
  ...props
}: FormInputProps<T>) {
  return (
    <FormField<T>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ value, onChange, onBlur }) => (
        <Input
          id={name}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          {...props}
        />
      )}
    </FormField>
  )
}
