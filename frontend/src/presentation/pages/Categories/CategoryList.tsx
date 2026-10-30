import { Typography, Box, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/application/api/categories'

export default function CategoryList() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page_size: 50 }),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Categor\u00edas</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nueva Categor\u00eda</Button>
      </Box>
      {isLoading && <Typography>Cargando...</Typography>}
      {data && (
        <Box>
          <Typography>Total: {data.total} categor\u00edas | P\u00e1gina {data.page}/{data.total_pages}</Typography>
          <Typography sx={{ mt: 1 }}>Conectado a API — lista de categor\u00edas en desarrollo</Typography>
        </Box>
      )}
    </Box>
  )
}

