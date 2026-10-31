import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Grid, Chip,
} from '@mui/material'
import { SupplierResponse } from '@/application/api/suppliers'

interface SupplierDetailDialogProps {
  open: boolean
  onClose: () => void
  supplier: SupplierResponse | null
}

export default function SupplierDetailDialog({ open, onClose, supplier }: SupplierDetailDialogProps) {
  if (!supplier) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalle Proveedor — {supplier.name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Nombre</Typography><Typography variant="body1">{supplier.name}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">CIF / Tax ID</Typography><Typography variant="body1">{supplier.tax_id || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Persona de contacto</Typography><Typography variant="body1">{supplier.contact_person || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Email</Typography><Typography variant="body1">{supplier.email || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Teléfono</Typography><Typography variant="body1">{supplier.phone || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Dirección</Typography><Typography variant="body1">{supplier.address || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Fecha creación</Typography><Typography variant="body1">{new Date(supplier.created_at).toLocaleDateString('es-ES')}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Última actualización</Typography><Typography variant="body1">{new Date(supplier.updated_at).toLocaleDateString('es-ES')}</Typography></Grid>
          <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Notas</Typography><Typography variant="body1">{supplier.notes || '-'}</Typography></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  )
}
