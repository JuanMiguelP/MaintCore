import {
  Typography, Box, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, TablePagination,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Inventory2 as AssetsIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getAssets, deleteAsset, updateAsset, createAsset, getCategories, getLocations, AssetResponse } from '@/application/api/assets'
import AssetForm from './AssetForm'
import AssetDetailDialog from './AssetDetailDialog'

export default function AssetList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailAsset, setDetailAsset] = useState<AssetResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['assets', page, pageSize, search, categoryFilter, locationFilter, statusFilter],
    queryFn: () => getAssets({ page: page + 1, page_size: pageSize, search: search || undefined, category_id: categoryFilter || undefined, location_id: locationFilter || undefined, status: statusFilter || undefined }),
  })

  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories({ page_size: 500 }) })
  const categories = categoriesData?.items || []

  const { data: locationsData } = useQuery({ queryKey: ['locations'], queryFn: () => getLocations({ page_size: 500 }) })
  const locations = locationsData?.items || []

  const deleteM = useMutation({ mutationFn: (id: string) => deleteAsset(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createAsset(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAsset(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setFormOpen(false); setEditingAsset(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })

  const handleCreate = () => { setEditingAsset(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (a: AssetResponse) => { setEditingAsset(a); setFormError(null); setFormOpen(true) }
  const handleView = (a: AssetResponse) => { setDetailAsset(a); setDetailOpen(true) }
  const handleSave = (payload: any) => { editingAsset ? updateM.mutate({ id: editingAsset.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }

  const statusColors: Record<string, string> = { ACTIVE: '#2e7d32', INACTIVE: '#757575', MAINTENANCE: '#f57c00', RETIRED: '#d32f2f' }
  const totalItems = data?.total || 0

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Activos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nuevo Activo</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar por cÃ³digo o nombre..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>CategorÃ­a</InputLabel>
          <Select value={categoryFilter} label="CategorÃ­a" onChange={e => setCategoryFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {categories.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>UbicaciÃ³n</InputLabel>
          <Select value={locationFilter} label="UbicaciÃ³n" onChange={e => setLocationFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {locations.map(l => (<MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={statusFilter} label="Estado" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
            <MenuItem value="RETIRED">Retired</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar los activos.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} activos | PÃ¡gina {data.page} de {data.total_pages}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CÃ³digo</TableCell><TableCell>Nombre</TableCell><TableCell>CategorÃ­a</TableCell><TableCell>UbicaciÃ³n</TableCell>
                  <TableCell>Estado</TableCell><TableCell>Fabricante</TableCell><TableCell>Modelo</TableCell><TableCell>Fecha creaciÃ³n</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <AssetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay activos</Typography>
                    <Typography variant="body2" color="text.secondary">{search || categoryFilter || locationFilter || statusFilter ? 'Sin resultados con los filtros aplicados' : 'Crea un nuevo activo para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(asset => (
                  <TableRow key={asset.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{asset.code}</Typography></TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category_name || '-'}</TableCell>
                    <TableCell>{asset.location_name || '-'}</TableCell>
                    <TableCell><Chip label={asset.status} size="small" sx={{ backgroundColor: statusColors[asset.status] || '#757575', color: 'white' }} /></TableCell>
                    <TableCell>{asset.manufacturer || '-'}</TableCell>
                    <TableCell>{asset.model || '-'}</TableCell>
                    <TableCell>{new Date(asset.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(asset)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(asset)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(asset.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalItems} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={pageSize} onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }} rowsPerPageOptions={[10, 20, 50, 100]} />
        </Box>
      )}

      <AssetForm open={formOpen} onClose={() => { setFormOpen(false); setEditingAsset(null); setFormError(null) }} onSave={handleSave} initialData={editingAsset} categories={categories} locations={locations} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: "background.paper", p: 4, borderRadius: 2, maxWidth: 400, width: "100%" }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminaci\u00f3n</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>\u00bfEst\u00e1s seguro de que quieres eliminar este activo?</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? "Eliminando..." : "Eliminar"}</Button>
            </Box>
          </Box>
        </Box>
      )}

      <AssetDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailAsset(null) }} asset={detailAsset} />
    </Box>
  )
}
