import type { FieldPath, FieldValues } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import type { TextareaProps } from '@/components/ui/textarea'
import { FormField } from './FormField'

interface FormTextareaProps<T extends FieldValues> extends Omit<TextareaProps, 'name'> {
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  required,
  ...props
}: FormTextareaProps<T>) {
  return (
    <FormField<T>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ value, onChange, onBlur }) => (
        <Textarea
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
