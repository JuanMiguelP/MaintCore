import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Grid, Chip,
} from '@mui/material'
import { LocationResponse } from '@/application/api/locations'

interface LocationDetailDialogProps {
  open: boolean
  onClose: () => void
  location: LocationResponse | null
}

export default function LocationDetailDialog({ open, onClose, location }: LocationDetailDialogProps) {
  if (!location) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalle UbicaciÃ³n — {location.name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Nombre</Typography><Typography variant="body1">{location.name}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">CÃ³digo</Typography><Typography variant="body1">{location.code || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">UbicaciÃ³n padre</Typography><Typography variant="body1">{location.parent_id ? 'SÃ­' : 'No (raÃ­z)'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">DirecciÃ³n</Typography><Typography variant="body1">{location.address || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Estado</Typography><Chip label={location.is_active ? 'Activa' : 'Inactiva'} size="small" sx={{ backgroundColor: location.is_active ? '#2e7d32' : '#9e9e9e', color: 'white' }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Fecha creaciÃ³n</Typography><Typography variant="body1">{new Date(location.created_at).toLocaleDateString('es-ES')}</Typography></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  )
}
