import { Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Add as AddIcon, Assignment as WoIcon, Build as BuildIcon, History as HistoryIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkOrders, deleteWorkOrder, changeStatus } from '@/application/api/work_orders'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  OPEN: '#1976d2',
  ASSIGNED: '#7b1fa2',
  IN_PROGRESS: '#f57c00',
  ON_HOLD: '#ff9800',
  COMPLETED: '#2e7d32',
  CANCELLED: '#d32f2f',
}

export default function WorkOrderList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', page, statusFilter],
    queryFn: () => getWorkOrders({ page, page_size: 20, status: statusFilter || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Â¿Eliminar esta orden de trabajo?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Órdenes de Trabajo</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nueva Orden</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filtrar por Estado</InputLabel>
          <Select value={statusFilter} label="Filtrar por Estado" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="ASSIGNED">Assigned</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="ON_HOLD">On Hold</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && <Typography>Cargando...</Typography>}

      {data && (
        <Box>
          <Typography sx={{ mb: 1 }}>Total: {data.total} órdenes | Página {data.page}/{data.total_pages}</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>WO Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((wo) => (
                  <TableRow key={wo.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{wo.wo_number}</Typography></TableCell>
                    <TableCell>{wo.title}</TableCell>
                    <TableCell>{wo.asset_name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={wo.priority} size="small" sx={{ backgroundColor: wo.priority === 'CRITICAL' ? '#d32f2f' : wo.priority === 'HIGH' ? '#f57c00' : wo.priority === 'MEDIUM' ? '#ff9800' : '#4caf50', color: 'white' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={wo.status} size="small" sx={{ backgroundColor: statusColors[wo.status] || '#757575', color: 'white' }} />
                    </TableCell>
                    <TableCell>{wo.technician_name || '-'}</TableCell>
                    <TableCell>{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View Details"><IconButton size="small" color="primary"><BuildIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Status History"><IconButton size="small" color="info"><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(wo.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {data.page} of {data.total_pages}</Typography>
            <Button size="small" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </Box>
        </Box>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <WoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hay órdenes de trabajo</Typography>
          <Typography variant="body2" color="text.secondary">Crea una nueva orden para comenzar</Typography>
        </Box>
      )}
    </Box>
  )
}
