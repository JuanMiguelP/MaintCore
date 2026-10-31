import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Chip,
} from '@mui/material'

interface StatusHistoryEntry {
  id: string
  work_order_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  changer_name: string | null
  changed_at: string
}

interface StatusHistoryDialogProps {
  open: boolean
  onClose: () => void
  entries: StatusHistoryEntry[]
}

const statusColors: Record<string, string> = {
  OPEN: '#1976d2', ASSIGNED: '#7b1fa2', IN_PROGRESS: '#f57c00',
  ON_HOLD: '#ff9800', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
}

export default function StatusHistoryDialog({ open, onClose, entries }: StatusHistoryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Historial de Estados</DialogTitle>
      <DialogContent dividers>
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay registros de cambios de estado.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado anterior</TableCell>
                  <TableCell>Estado nuevo</TableCell>
                  <TableCell>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{new Date(entry.changed_at).toLocaleString('es-ES')}</TableCell>
                    <TableCell>
                      {entry.old_status ? (
                        <Chip label={entry.old_status} size="small" sx={{ backgroundColor: statusColors[entry.old_status] || '#757575', color: 'white' }} />
                      ) : (
                        <Typography variant="body2" color="text.disabled">Creación</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={entry.new_status} size="small" sx={{ backgroundColor: statusColors[entry.new_status] || '#757575', color: 'white' }} />
                    </TableCell>
                    <TableCell>{entry.changer_name || entry.changed_by || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
