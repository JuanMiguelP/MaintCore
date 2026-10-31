import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { globalSearch, transformResults, groupResults, moduleRoutes, SearchModule } from '@/application/api/search'
import { usePermissions } from '@/application/hooks/usePermissions'
import { useNavigate } from 'react-router-dom'

const DEBOUNCE_MS = 300
const MAX_RESULTS = 8

const MODULE_PERMISSIONS: Record<SearchModule, string> = {
  assets: 'assets.read',
  inventory: 'inventory.read',
  work_orders: 'work_orders.read',
  suppliers: 'suppliers.read',
  locations: 'locations.read',
}

const MODULE_ICONS: Record<SearchModule, string> = {
  assets: '\U0001f4e6',
  inventory: '\U0001f527',
  work_orders: '\U0001f4cb',
  suppliers: '\U0001f3e2',
  locations: '\U0001f4cd',
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const canSearch = Object.entries(MODULE_PERMISSIONS).some(
    ([mod, perm]) => hasPermission(perm)
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: canSearch && debouncedQuery.length >= 1,
    refetchOnWindowFocus: false,
  })

  const groupedResults = data ? groupResults(transformResults(data)) : []
  const totalResults = data ? transformResults(data).length : 0

  const handleSelect = useCallback((module: SearchModule, id: string) => {
    setOpen(false)
    setQuery('')
    navigate(moduleRoutes[module] + "#" + id)
  }, [navigate])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleFocus = useCallback(() => {
    if (query.length >= 1 && groupedResults.length > 0) {
      setOpen(true)
    }
  }, [query, groupedResults])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setOpen(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const hasResults = groupedResults.length > 0
  const showDropdown = open && (query.length >= 1 || isLoading || error)

  return (
    <Box sx={{ position: 'relative' }} ref={inputRef}>
      <TextField
        inputRef={inputRef}
        size="small"
        placeholder="Buscar... (Ctrl+K)"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          sx: {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            '& fieldset': { border: 'none' },
            color: 'inherit',
            '& input::placeholder': { color: 'rgba(255,255,255,0.6)' },
          },
        }}
        sx={{ width: { xs: 140, sm: 200, md: 280 } }}
      />

      {showDropdown && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1200,
            boxShadow: 8,
          }}
        >

          {isLoading && query.length >= 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && query.length >= 1 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="error">
                Error al buscar. Intenta de nuevo.
              </Typography>
            </Box>
          )}

          {!isLoading && !error && query.length >= 1 && !hasResults && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron resultados para "{query}"
              </Typography>
            </Box>
          )}

          {hasResults && (
            <List sx={{ py: 0 }}>
              {groupedResults.map((group, idx) => (
                <Box key={group.module}>
                  {idx > 0 && <Divider />}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2,
                      py: 1,
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.icon} {group.label} ({group.items.length})
                  </Typography>
                  {group.items.slice(0, MAX_RESULTS).map((item) => (
                    <ListItemButton
                      key={item.module + "-" + item.id}
                      onClick={() => handleSelect(item.module, item.id)}
                      sx={{ py: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Typography variant="body2">{MODULE_ICONS[item.module]}</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.label}
                          </Typography>
                        }
                        secondary={item.subtitle && (
                          <Typography variant="caption" color="text.secondary">
                            {item.subtitle}
                          </Typography>
                        )}
                      />
                    </ListItemButton>
                  ))}
                </Box>
              ))}

              {totalResults > MAX_RESULTS * groupedResults.length && (
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                  <Chip
                    label={'Mostrando ' + Math.min(totalResults, MAX_RESULTS * groupedResults.length) + ' de ' + totalResults + ' resultados'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
            </List>
          )}

          {query.length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Escribe al menos un caracter para buscar
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  )
}
