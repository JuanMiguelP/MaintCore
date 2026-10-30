import { Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotificationRules, deleteNotificationRule } from '@/application/api/notifications'
import { useState } from 'react'

const EVENT_LABELS: Record<string, string> = {
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
  WORK_ORDER_ASSIGNED: 'OT Asignada',
  WORK_ORDER_COMPLETED: 'OT Completada',
  WORK_ORDER_CANCELLED: 'OT Cancelada',
  PREVENTIVE_OVERDUE: 'Preventivo Vencido',
  CRITICAL_WORK_ORDER: 'OT Crítica',
}

export default function NotificationSettings() {
  const [page, setPage] = useState(1)
  const [openDialog, setOpenDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notification-rules', page],
    queryFn: () => getNotificationRules({ page, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotificationRule(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notification-rules'] }) },
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Configuración de Notificaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>Nueva Regla</Button>
      </Box>

      {isLoading && <Typography>Cargando...</Typography>}

      {data && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Evento</TableCell>
                <TableCell>Destinatarios</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{EVENT_LABELS[rule.event_type] || rule.event_type}</TableCell>
                  <TableCell>{rule.recipients.join(', ')}</TableCell>
                  <TableCell>{rule.frequency}</TableCell>
                  <TableCell>
                    <Switch checked={rule.enabled} disabled size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(rule.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
        <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {data?.page || 1} of {data?.total_pages || 1}</Typography>
        <Button size="small" disabled={page >= (data?.total_pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
      </Box>
    </Box>
  )
}
