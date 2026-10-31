import { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { usePermissions } from '@/application/hooks/usePermissions'

interface PermissionGateProps {
  permission: string
  fallback?: ReactNode
  children: ReactNode
  role?: string | null
  customPermissions?: string[]
}

export default function PermissionGate({
  permission,
  fallback = null,
  children,
  role,
  customPermissions,
}: PermissionGateProps) {
  const { hasPermission } = usePermissions({ role, customPermissions })

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface ForbiddenMessageProps {
  message?: string
}

export function ForbiddenMessage({ message = 'No dispone de permisos para esta acciÃ³n.' }: ForbiddenMessageProps) {
  return (
    <Box sx={{ p: 2, backgroundColor: 'warning.lighter', borderRadius: 1, mb: 2 }}>
      <Typography variant="body2" color="warning.dark">{message}</Typography>
    </Box>
  )
}
