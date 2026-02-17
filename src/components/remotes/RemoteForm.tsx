import { z } from 'zod'

export const remoteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  policy: z.enum(['immediate', 'on_demand', 'streamed']),
  tls_validation: z.boolean(),
  ca_cert: z.string().optional(),
  client_cert: z.string().optional(),
  client_key: z.string().optional(),
  proxy_url: z.string().optional(),
  download_concurrency: z.number().int().positive().optional(),
  max_retries: z.number().int().min(0).optional(),
  total_timeout: z.number().positive().optional(),
  connect_timeout: z.number().positive().optional(),
  pulp_labels: z.record(z.string(), z.string()).optional(),
})

export type RemoteFormData = z.infer<typeof remoteSchema>

export const defaultRemoteValues: RemoteFormData = {
  name: '',
  url: '',
  policy: 'on_demand',
  tls_validation: true,
  ca_cert: undefined,
  client_cert: undefined,
  client_key: undefined,
  proxy_url: undefined,
  download_concurrency: undefined,
  max_retries: undefined,
  total_timeout: undefined,
  connect_timeout: undefined,
  pulp_labels: {},
}

import { FormInput, FormSelect, FormTextarea, FormSwitch, FormField } from '@/components/forms'
import { LabelsEditor } from '@/components/labels'

interface RemoteFormFieldsProps {
  isSubmitting?: boolean
}

export function RemoteFormFields({ isSubmitting }: RemoteFormFieldsProps) {
  const policyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'on_demand', label: 'On Demand' },
    { value: 'streamed', label: 'Streamed' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput<RemoteFormData>
          name="name"
          label="Name"
          required
          placeholder="Enter remote name"
          disabled={isSubmitting}
        />
        <FormInput<RemoteFormData>
          name="url"
          label="URL"
          required
          type="url"
          placeholder="https://example.com/repo/"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect<RemoteFormData>
          name="policy"
          label="Policy"
          options={policyOptions}
          placeholder="Select policy"
          disabled={isSubmitting}
        />
        <FormInput<RemoteFormData>
          name="proxy_url"
          label="Proxy URL"
          placeholder="http://proxy:8080"
          disabled={isSubmitting}
        />
      </div>

      <FormSwitch<RemoteFormData>
        name="tls_validation"
        label="TLS Validation"
        description="Validate TLS certificates when connecting to the remote"
        disabled={isSubmitting}
      />

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Certificates</h3>
        <FormTextarea<RemoteFormData>
          name="ca_cert"
          label="CA Certificate"
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          rows={4}
          disabled={isSubmitting}
        />
        <FormTextarea<RemoteFormData>
          name="client_cert"
          label="Client Certificate"
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          rows={4}
          disabled={isSubmitting}
        />
        <FormTextarea<RemoteFormData>
          name="client_key"
          label="Client Key"
          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Timeout & Concurrency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput<RemoteFormData>
            name="download_concurrency"
            label="Download Concurrency"
            type="number"
            placeholder="e.g., 10"
            disabled={isSubmitting}
          />
          <FormInput<RemoteFormData>
            name="max_retries"
            label="Max Retries"
            type="number"
            placeholder="e.g., 3"
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput<RemoteFormData>
            name="total_timeout"
            label="Total Timeout (seconds)"
            type="number"
            placeholder="e.g., 300"
            disabled={isSubmitting}
          />
          <FormInput<RemoteFormData>
            name="connect_timeout"
            label="Connect Timeout (seconds)"
            type="number"
            placeholder="e.g., 30"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Labels</h3>
        <FormField<RemoteFormData>
          name="pulp_labels"
          label="Labels"
          description="Key-value labels for organizing and filtering remotes"
        >
          {({ value, onChange }) => (
            <LabelsEditor
              value={(value as Record<string, string>) || {}}
              onChange={onChange}
              disabled={isSubmitting}
            />
          )}
        </FormField>
      </div>
    </div>
  )
}

