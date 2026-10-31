import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Chip, Grid, Tabs, Tab,
} from '@mui/material'
import React from 'react'
import { WorkOrderResponse, WorkOrderPartResponse, StatusHistoryEntry } from '@/application/api/work_orders'

interface WorkOrderDetailDialogProps {
  open: boolean
  onClose: () => void
  wo: WorkOrderResponse | null
  parts: WorkOrderPartResponse[]
  statusHistory: StatusHistoryEntry[]
}

const statusColors: Record<string, string> = {
  OPEN: '#1976d2', ASSIGNED: '#7b1fa2', IN_PROGRESS: '#f57c00',
  ON_HOLD: '#ff9800', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
}
const priorityColors: Record<string, string> = {
  LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f57c00', CRITICAL: '#d32f2f',
}

export default function WorkOrderDetailDialog({ open, onClose, wo, parts, statusHistory }: WorkOrderDetailDialogProps) {
  if (!wo) return null
  const [tab, setTab] = React.useState(0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle OT — {wo.wo_number}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Título</Typography><Typography variant="body1">{wo.title}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Estado</Typography><Chip label={wo.status} size="small" sx={{ backgroundColor: statusColors[wo.status] || '#757575', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Prioridad</Typography><Chip label={wo.priority} size="small" sx={{ backgroundColor: priorityColors[wo.priority] || '#757575', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Activo</Typography><Typography variant="body1">{wo.asset_name || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Técnico</Typography><Typography variant="body1">{wo.technician_name || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Solicitante</Typography><Typography variant="body1">{wo.requester_name || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Fecha programada</Typography><Typography variant="body1">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString('es-ES') : '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Horas estimadas</Typography><Typography variant="body1">{wo.estimated_hours ? `${wo.estimated_hours}h` : '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Horas reales</Typography><Typography variant="body1">{`${wo.actual_hours}h`}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Fecha creación</Typography><Typography variant="body1">{new Date(wo.created_at).toLocaleDateString('es-ES')}</Typography></Grid>
          <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Descripción</Typography><Typography variant="body1">{wo.description || '-'}</Typography></Grid>
          <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Notas</Typography><Typography variant="body1">{wo.notes || '-'}</Typography></Grid>
        </Grid>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2, mb: 1 }}>
          <Tab label={`Repuestos (${parts.length})`} />
          <Tab label={`Historial (${statusHistory.length})`} />
        </Tabs>

        {tab === 0 && (
          parts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No hay repuestos asignados.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow><TableCell>Repuesto</TableCell><TableCell align="right">Cantidad</TableCell><TableCell align="right">Coste unit.</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                <TableBody>{parts.map(p => (<TableRow key={p.id}><TableCell>{p.part_name || p.part_number || p.part_id}</TableCell><TableCell align="right">{p.quantity}</TableCell><TableCell align="right">{p.unit_cost.toFixed(2)} €</TableCell><TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{p.total_cost.toFixed(2)} €</Typography></TableCell></TableRow>))}</TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {tab === 1 && (
          statusHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No hay registros de cambios.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Anterior</TableCell><TableCell>Nuevo</TableCell><TableCell>Usuario</TableCell></TableRow></TableHead>
                <TableBody>{statusHistory.map(s => (<TableRow key={s.id}><TableCell>{new Date(s.changed_at).toLocaleString('es-ES')}</TableCell><TableCell><Chip label={s.old_status || 'Creación'} size="small" sx={{ backgroundColor: s.old_status ? statusColors[s.old_status] || '#757575' : '#9e9e9e', color: 'white' }} /></TableCell><TableCell><Chip label={s.new_status} size="small" sx={{ backgroundColor: statusColors[s.new_status] || '#757575', color: 'white' }} /></TableCell><TableCell>{s.changer_name || s.changed_by || '-'}</TableCell></TableRow>))}</TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  )
}
