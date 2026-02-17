import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput } from '@/components/forms/FormInput'
import { FormSwitch } from '@/components/forms/FormSwitch'
import { FormField } from '@/components/forms/FormField'
import { CronEditor } from './CronEditor'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Common Pulp tasks that can be scheduled
const COMMON_TASKS = [
  { value: 'pulpcore.app.tasks.orphan.orphan_cleanup', label: 'Orphan Cleanup' },
  { value: 'pulpcore.app.tasks.repository.version_recovery', label: 'Repository Version Recovery' },
  { value: 'pulp_file.app.tasks.synchronizing.synchronize', label: 'File Sync' },
  { value: 'pulp_rpm.app.tasks.synchronizing.synchronize', label: 'RPM Sync' },
  { value: 'pulp_python.app.tasks.sync.sync', label: 'Python Sync' },
  { value: 'pulp_container.app.tasks.synchronize.synchronize', label: 'Container Sync' },
  { value: 'pulp_deb.app.tasks.synchronizing.synchronize', label: 'Debian Sync' },
  { value: 'pulp_ansible.app.tasks.collections.sync', label: 'Ansible Sync' },
]

const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  task: z.string().min(1, 'Task is required'),
  cron: z.string().min(1, 'Cron expression is required'),
  enabled: z.boolean(),
  arguments: z.string().optional(),
  concurrency_limit: z.number().int().min(1).nullable().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>

interface ScheduleFormProps {
  form: UseFormReturn<ScheduleFormData>
}

export function useScheduleForm(defaultValues?: Partial<ScheduleFormData>) {
  // Convert arguments object to string for editing
  const processedDefaults = {
    name: '',
    task: '',
    cron: '0 0 * * *',
    enabled: true,
    arguments: '{}',
    concurrency_limit: null,
    ...defaultValues,
  }

  return useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: processedDefaults,
  })
}

export function ScheduleForm({ form }: ScheduleFormProps) {
  const { register, formState, watch, setValue } = form
  const cronValue = watch('cron')
  const taskValue = watch('task')

  const handleTaskSelect = (task: string) => {
    setValue('task', task)
  }

  return (
    <div className="space-y-4">
      <FormInput<ScheduleFormData>
        name="name"
        label="Name"
        placeholder="Enter schedule name"
        required
        disabled={formState.isSubmitting}
      />

      <div className="space-y-2">
        <Label>Task *</Label>
        <div className="space-y-2">
          <input
            type="text"
            {...register('task')}
            placeholder="Enter task name or select from common tasks"
            disabled={formState.isSubmitting}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {formState.errors.task && (
            <p className="text-xs text-destructive">{formState.errors.task.message}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMON_TASKS.map((task) => (
            <button
              key={task.value}
              type="button"
              onClick={() => handleTaskSelect(task.value)}
              disabled={formState.isSubmitting}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                taskValue === task.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {task.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cron Schedule *</Label>
        <CronEditor
          value={cronValue || '0 0 * * *'}
          onChange={(value) => setValue('cron', value)}
          disabled={formState.isSubmitting}
        />
        {formState.errors.cron && (
          <p className="text-xs text-destructive">{formState.errors.cron.message}</p>
        )}
      </div>

      <FormSwitch<ScheduleFormData>
        name="enabled"
        label="Enabled"
        description="Schedule will run when enabled"
        disabled={formState.isSubmitting}
      />

      <FormField<ScheduleFormData>
        name="arguments"
        label="Arguments (JSON)"
        description="JSON object with task arguments"
      >
        {({ value, onChange }) => (
          <Textarea
            value={(value as string) || '{}'}
            onChange={(e) => onChange(e.target.value)}
            placeholder='{"key": "value"}'
            rows={4}
            disabled={formState.isSubmitting}
            className="font-mono text-sm"
          />
        )}
      </FormField>

      <FormInput<ScheduleFormData>
        name="concurrency_limit"
        label="Concurrency Limit"
        placeholder="Maximum concurrent runs (optional)"
        type="number"
        min={1}
        disabled={formState.isSubmitting}
      />
    </div>
  )
}
