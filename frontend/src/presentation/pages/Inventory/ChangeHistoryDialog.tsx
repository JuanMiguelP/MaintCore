import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material'
import { PartChangeLogEntry } from '@/application/api/inventory'

interface ChangeHistoryDialogProps {
  open: boolean
  onClose: () => void
  entries: PartChangeLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

const fieldLabels: Record<string, string> = {
  part_number: 'Part Number',
  name: 'Nombre',
  description: 'Descripción',
  manufacturer: 'Fabricante',
  supplier_id: 'Proveedor',
  unit_cost: 'Coste unitario',
  minimum_stock: 'Stock mínimo',
  current_stock: 'Stock actual',
  location: 'Ubicación',
  notes: 'Notas',
}

export default function ChangeHistoryDialog({
  open,
  onClose,
  entries,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: ChangeHistoryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Historial de Cambios</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total: {total} cambios | Página {page} de {totalPages}
        </Typography>

        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay registros de cambios para este repuesto.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Campo</TableCell>
                  <TableCell>Valor anterior</TableCell>
                  <TableCell>Valor nuevo</TableCell>
                  <TableCell>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fieldLabels[entry.field_name] || entry.field_name}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        textDecoration: 'line-through',
                        color: 'text.disabled',
                        fontFamily: 'monospace',
                      }}>
                        {entry.old_value ?? '(vacío)'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}>
                        {entry.new_value ?? '(vacío)'}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.performed_by || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button
              size="small"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              Página {page} de {totalPages}
            </Typography>
            <Button
              size="small"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
