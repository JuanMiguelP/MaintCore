import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Grid, Chip,
} from '@mui/material'
import { NotificationRuleResponse } from '@/application/api/notifications'

interface NotificationRuleDetailDialogProps {
  open: boolean
  onClose: () => void
  rule: NotificationRuleResponse | null
}

const EVENT_LABELS: Record<string, string> = {
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
  STOCK_RECOVERED: 'Stock Recuperado',
  WORK_ORDER_ASSIGNED: 'OT Asignada',
  WORK_ORDER_COMPLETED: 'OT Completada',
  WORK_ORDER_CANCELLED: 'OT Cancelada',
  PREVENTIVE_OVERDUE: 'Preventivo Vencido',
  CRITICAL_WORK_ORDER: 'OT Crítica',
}

const EVENT_COLORS: Record<string, string> = {
  LOW_STOCK: '#ff9800', OUT_OF_STOCK: '#d32f2f', STOCK_RECOVERED: '#4caf50',
  WORK_ORDER_ASSIGNED: '#1976d2', WORK_ORDER_COMPLETED: '#2e7d32',
  WORK_ORDER_CANCELLED: '#757575', PREVENTIVE_OVERDUE: '#f57c00',
  CRITICAL_WORK_ORDER: '#b71c1c',
}

export default function NotificationRuleDetailDialog({ open, onClose, rule }: NotificationRuleDetailDialogProps) {
  if (!rule) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalle Regla — {rule.name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Nombre</Typography><Typography variant="body1">{rule.name}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Tipo de evento</Typography><Chip label={EVENT_LABELS[rule.event_type] || rule.event_type} size="small" sx={{ backgroundColor: EVENT_COLORS[rule.event_type] || '#757575', color: 'white' }} /></Grid>
          <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Destinatarios</Typography><Typography variant="body1">{rule.recipients.join(', ')}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Frecuencia</Typography><Typography variant="body1">{rule.frequency || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Estado</Typography><Chip label={rule.enabled ? 'Activa' : 'Inactiva'} size="small" sx={{ backgroundColor: rule.enabled ? '#2e7d32' : '#9e9e9e', color: 'white' }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  )
}
