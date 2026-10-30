import { Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Add as AddIcon, Build as PlanIcon, Warning as OverdueIcon, Event as UpcomingIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMaintenancePlans, deleteMaintenancePlan, autoGenerateOverdue, getOverduePlans, getUpcomingPlans } from '@/application/api/preventive_maintenance'
import { useState } from 'react'

const freqColors: Record<string, string> = {
  DAILY: '#1976d2', WEEKLY: '#7b1fa2', MONTHLY: '#f57c00', QUARTERLY: '#00796b', YEARLY: '#4caf50',
}

export default function PreventiveMaintenanceList() {
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'all' | 'overdue' | 'upcoming'>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['preventive-maintenance', tab, page],
    queryFn: () => {
      if (tab === 'overdue') return getOverduePlans({ page, page_size: 20 })
      if (tab === 'upcoming') return getUpcomingPlans({ days_ahead: 30, page, page_size: 20 })
      return getMaintenancePlans({ page, page_size: 20 })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMaintenancePlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['preventive-maintenance'] }) },
  })

  const autoGenMutation = useMutation({
    mutationFn: autoGenerateOverdue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['preventive-maintenance'] }) },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Â¿Eliminar este plan preventivo?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Mantenimiento Preventivo</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Plan</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button variant={tab === 'all' ? 'contained' : 'outlined'} onClick={() => setTab('all')}>Todos</Button>
        <Button variant={tab === 'overdue' ? 'contained' : 'outlined'} onClick={() => setTab('overdue')} startIcon={<OverdueIcon />}>Vencidos</Button>
        <Button variant={tab === 'upcoming' ? 'contained' : 'outlined'} onClick={() => setTab('upcoming')} startIcon={<UpcomingIcon />}>PrÃ³ximos</Button>
      </Box>

      {tab === 'overdue' && (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" color="warning" onClick={() => autoGenMutation.mutate()} startIcon={<PlanIcon />}>
            Generar Ejecuciones Vencidas
          </Button>
        </Box>
      )}

      {isLoading && <Typography>Cargando...</Typography>}

      {data && (
        <Box>
          <Typography sx={{ mb: 1 }}>Total: {data.total} planes | PÃ¡gina {data.page}/{data.total_pages}</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Due</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((plan) => (
                  <TableRow key={plan.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{plan.code}</Typography></TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.asset_name || '-'}</TableCell>
                    <TableCell><Chip label={`${plan.frequency_value}x ${plan.frequency_type}`} size="small" sx={{ backgroundColor: freqColors[plan.frequency_type] || '#757575', color: 'white' }} /></TableCell>
                    <TableCell>{plan.next_due_date ? new Date(plan.next_due_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Chip label={plan.priority} size="small" sx={{ backgroundColor: plan.priority === 'CRITICAL' ? '#d32f2f' : plan.priority === 'HIGH' ? '#f57c00' : '#4caf50', color: 'white' }} /></TableCell>
                    <TableCell><Chip label={plan.is_active ? 'Active' : 'Inactive'} size="small" sx={{ backgroundColor: plan.is_active ? '#2e7d32' : '#757575', color: 'white' }} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View Details"><IconButton size="small" color="primary"><PlanIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(plan.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
          <PlanIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hay planes preventivos</Typography>
          <Typography variant="body2" color="text.secondary">Crea un nuevo plan para comenzar</Typography>
        </Box>
      )}
    </Box>
  )
}
