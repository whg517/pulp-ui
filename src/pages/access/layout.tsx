import { Outlet } from 'react-router-dom'
import { Card } from '@/components/ui/card'

export function AccessLayout() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Outlet />
      </Card>
    </div>
  )
}

export default AccessLayout