import api from './client'

// Tipos de resultado por módulo
export interface SearchResultAsset {
  id: string
  code: string
  name: string
  category_name: string | null
  location_name: string | null
}

export interface SearchResultPart {
  id: string
  part_number: string
  name: string
}

export interface SearchResultWorkOrder {
  id: string
  wo_number: string
  title: string
  status: string
}

export interface SearchResultSupplier {
  id: string
  name: string
}

export interface SearchResultLocation {
  id: string
  name: string
  code: string | null
}

// Resultado agrupado por módulo
export interface GlobalSearchResults {
  assets: SearchResultAsset[]
  inventory: SearchResultPart[]
  work_orders: SearchResultWorkOrder[]
  suppliers: SearchResultSupplier[]
  locations: SearchResultLocation[]
}

export interface GlobalSearchResponse {
  query: string
  results: GlobalSearchResults
}

// Mapeo de módulo a tipo de resultado
export type SearchModule = 'assets' | 'inventory' | 'work_orders' | 'suppliers' | 'locations'

export interface SearchResultItem {
  module: SearchModule
  id: string
  label: string
  subtitle?: string
}

/**
 * Buscar en todos los módulos disponibles.
 * @param query - Término de búsqueda (mínimo 1 carácter)
 * @returns Resultados agrupados por módulo
 */
export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  const { data } = await api.get('/search', { params: { q: query } })
  return data
}

/**
 * Transformar resultados de la API en items planos para la UI.
 */
export function transformResults(response: GlobalSearchResponse): SearchResultItem[] {
  const items: SearchResultItem[] = []

  for (const asset of response.results.assets) {
    items.push({
      module: 'assets',
      id: asset.id,
      label: `${asset.code} — ${asset.name}`,
      subtitle: [asset.category_name, asset.location_name].filter(Boolean).join(' · ') || undefined,
    })
  }

  for (const part of response.results.inventory) {
    items.push({
      module: 'inventory',
      id: part.id,
      label: `${part.part_number} — ${part.name}`,
    })
  }

  for (const wo of response.results.work_orders) {
    items.push({
      module: 'work_orders',
      id: wo.id,
      label: `${wo.wo_number} — ${wo.title}`,
      subtitle: `Estado: ${wo.status}`,
    })
  }

  for (const supplier of response.results.suppliers) {
    items.push({
      module: 'suppliers',
      id: supplier.id,
      label: supplier.name,
    })
  }

  for (const location of response.results.locations) {
    items.push({
      module: 'locations',
      id: location.id,
      label: `${location.code || ''} — ${location.name}`,
    })
  }

  return items
}

/**
 * Agrupar resultados planos por módulo para la UI.
 */
export function groupResults(items: SearchResultItem[]): Array<{ module: SearchModule; label: string; icon: string; items: SearchResultItem[] }> {
  const modules: Record<SearchModule, { label: string; icon: string }> = {
    assets: { label: 'Activos', icon: '📦' },
    inventory: { label: 'Repuestos', icon: '🔧' },
    work_orders: { label: 'Órdenes de Trabajo', icon: '📋' },
    suppliers: { label: 'Proveedores', icon: '🏢' },
    locations: { label: 'Ubicaciones', icon: '📍' },
  }

  const groups: Record<SearchModule, SearchResultItem[]> = {
    assets: [],
    inventory: [],
    work_orders: [],
    suppliers: [],
    locations: [],
  }

  for (const item of items) {
    groups[item.module].push(item)
  }

  return Object.entries(modules)
    .filter(([module]) => groups[module as SearchModule].length > 0)
    .map(([module, info]) => ({
      module: module as SearchModule,
      label: info.label,
      icon: info.icon,
      items: groups[module as SearchModule],
    }))
}

/**
 * Mapeo de módulo a ruta de navegación.
 */
export const moduleRoutes: Record<SearchModule, string> = {
  assets: '/assets',
  inventory: '/inventory',
  work_orders: '/work-orders',
  suppliers: '/suppliers',
  locations: '/locations',
}
