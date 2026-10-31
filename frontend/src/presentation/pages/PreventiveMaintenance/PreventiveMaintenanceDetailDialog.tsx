import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material'
import { MaintenancePlanResponse } from '@/application/api/preventive_maintenance'

interface PreventiveMaintenanceDetailDialogProps {
  open: boolean
  onClose: () => void
  plan: MaintenancePlanResponse | null
}

const freqLabels: Record<string, string> = {
  DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', YEARLY: 'Anual',
}

export default function PreventiveMaintenanceDetailDialog({ open, onClose, plan }: PreventiveMaintenanceDetailDialogProps) {
  if (!plan) return null

  const isOverdue = plan.next_due_date && new Date(plan.next_due_date) < new Date()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle Plan — {plan.code}: {plan.name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Código</Typography><Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{plan.code}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Estado</Typography><Chip label={plan.is_active ? 'Activo' : 'Inactivo'} size="small" sx={{ backgroundColor: plan.is_active ? '#2e7d32' : '#757575', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Activo</Typography><Typography variant="body1">{plan.asset_name || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Frecuencia</Typography><Chip label={`${plan.frequency_value}x ${freqLabels[plan.frequency_type] || plan.frequency_type}`} size="small" sx={{ backgroundColor: '#1976d2', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Próxima ejecución</Typography><Typography variant="body1" sx={{ color: isOverdue ? '#d32f2f' : 'inherit', fontWeight: isOverdue ? 600 : 'inherit' }}>{plan.next_due_date ? new Date(plan.next_due_date).toLocaleDateString('es-ES') : '-'}{isOverdue && ' ⚠️ Vencido'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Última generación</Typography><Typography variant="body1">{plan.last_generated_at ? new Date(plan.last_generated_at).toLocaleDateString('es-ES') : '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Horas estimadas</Typography><Typography variant="body1">{plan.estimated_hours ? `${plan.estimated_hours}h` : '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Prioridad</Typography><Chip label={plan.priority} size="small" sx={{ backgroundColor: plan.priority === 'CRITICAL' ? '#d32f2f' : plan.priority === 'HIGH' ? '#f57c00' : '#4caf50', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Creado por</Typography><Typography variant="body1">{plan.created_by || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Fecha creación</Typography><Typography variant="body1">{new Date(plan.created_at).toLocaleDateString('es-ES')}</Typography></Grid>
          <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Descripción</Typography><Typography variant="body1">{plan.description || '-'}</Typography></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  )
}
