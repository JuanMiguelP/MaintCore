import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Chip, Grid,
} from '@mui/material'
import { AssetResponse } from '@/application/api/assets'

interface AssetDetailDialogProps {
  open: boolean
  onClose: () => void
  asset: AssetResponse | null
}

const statusColors: Record<string, string> = {
  ACTIVE: '#2e7d32',
  INACTIVE: '#757575',
  MAINTENANCE: '#f57c00',
  RETIRED: '#d32f2f',
}

export default function AssetDetailDialog({ open, onClose, asset }: AssetDetailDialogProps) {
  if (!asset) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle del Activo</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Código</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{asset.code}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
            <Typography variant="body1">{asset.name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Categoría</Typography>
            <Typography variant="body1">{asset.category_name || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Ubicación</Typography>
            <Typography variant="body1">{asset.location_name || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
            <Chip label={asset.status} size="small" sx={{ backgroundColor: statusColors[asset.status] || '#757575', color: 'white' }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Fabricante</Typography>
            <Typography variant="body1">{asset.manufacturer || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Modelo</Typography>
            <Typography variant="body1">{asset.model || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Número de serie</Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{asset.serial_number || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Fecha de compra</Typography>
            <Typography variant="body1">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('es-ES') : '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Fecha de creación</Typography>
            <Typography variant="body1">{new Date(asset.created_at).toLocaleDateString('es-ES')}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
            <Typography variant="body1">{asset.description || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Notas</Typography>
            <Typography variant="body1">{asset.notes || '-'}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
