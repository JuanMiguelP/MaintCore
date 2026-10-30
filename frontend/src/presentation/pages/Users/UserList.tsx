import { Typography, Box, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/application/api/auth'

export default function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(1, 20),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Usuario</Button>
      </Box>
      {isLoading && <Typography>Cargando...</Typography>}
      {data && (
        <Box>
          <Typography>Total: {data.total} usuarios | P\u00e1gina {data.page}/{data.total_pages}</Typography>
          <Typography sx={{ mt: 1 }}>Conectado a API — lista de usuarios en desarrollo</Typography>
        </Box>
      )}
    </Box>
  )
}

