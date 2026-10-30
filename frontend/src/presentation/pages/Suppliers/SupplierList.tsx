import { Typography, Box, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getSuppliers } from '@/application/api/suppliers'

export default function SupplierList() {
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers({ page_size: 20 }),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Proveedores</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Proveedor</Button>
      </Box>
      {isLoading && <Typography>Cargando...</Typography>}
      {data && (
        <Box>
          <Typography>Total: {data.total} proveedores | P\u00e1gina {data.page}/{data.total_pages}</Typography>
          <Typography sx={{ mt: 1 }}>Conectado a API — lista de proveedores en desarrollo</Typography>
        </Box>
      )}
    </Box>
  )
}
