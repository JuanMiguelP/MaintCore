import { Typography, Box, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getStockMovements } from '@/application/api/inventory'

export default function StockMovementList() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => getStockMovements({ page_size: 20 }),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Movimientos de Stock</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Movimiento</Button>
      </Box>
      {isLoading && <Typography>Cargando...</Typography>}
      {data && (
        <Box>
          <Typography>Total: {data.total} movimientos | P\u00e1gina {data.page}/{data.total_pages}</Typography>
          <Typography sx={{ mt: 1 }}>Conectado a API — lista de movimientos en desarrollo</Typography>
        </Box>
      )}
    </Box>
  )
}
