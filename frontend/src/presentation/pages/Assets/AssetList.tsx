import { Typography, Box, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getAssets } from '@/application/api/assets'

export default function AssetList() {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets({ page_size: 20 }),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Activos</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Activo</Button>
      </Box>
      {isLoading && <Typography>Cargando...</Typography>}
      {data && (
        <Box>
          <Typography>Total: {data.total} activos | P\u00e1gina {data.page}/{data.total_pages}</Typography>
          <Typography sx={{ mt: 1 }}>Conectado a API — lista de activos en desarrollo</Typography>
        </Box>
      )}
    </Box>
  )
}

