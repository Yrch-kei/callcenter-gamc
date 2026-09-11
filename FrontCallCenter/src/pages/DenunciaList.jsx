import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import {
  Search, SlidersHorizontal, ChevronUp, ChevronDown,
  Eye, Plus, ChevronLeft, ChevronRight, X, Inbox, Calendar, Download,
} from 'lucide-react'
import gsap from 'gsap'
import dayjs from 'dayjs'
import { Button, Select, Tabs } from '@/components/ui'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityIndicator from '@/components/shared/PriorityIndicator'
import { useDenuncias } from '@/context/DenunciasContext'
import complaintService from '@/services/complaintService'
import { DENUNCIA_STATUS, PRIORITY, AREAS_OPERATIVAS } from '@/utils/constants'
import { cn } from '@/utils/cn'

// ── Filter configs ─────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: '',               label: 'Toda urgencia'  },
  { value: PRIORITY.URGENTE, label: '🔴 Urgente'     },
  { value: PRIORITY.ALTA,    label: '🟠 Alta'         },
  { value: PRIORITY.MEDIA,   label: '🟡 Media'        },
  { value: PRIORITY.BAJA,    label: '⚪ Baja'         },
]

const PRIORITY_CHIP_LABELS = {
  [PRIORITY.URGENTE]: '🔴 Urgente',
  [PRIORITY.ALTA]:    '🟠 Alta',
  [PRIORITY.MEDIA]:   '🟡 Media',
  [PRIORITY.BAJA]:    '⚪ Baja',
}

const AREA_OPTIONS = [
  { value: '', label: 'Todas las áreas' },
  ...AREAS_OPERATIVAS.map((a) => ({ value: a, label: a })),
]

const DATE_INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3.5 text-sm text-text-primary ' +
  'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ' +
  'dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary'

// ── ActiveChip ─────────────────────────────────────────────────────────────────
function ActiveChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-700/15 dark:text-primary">
      {label}
      <button
        onClick={onRemove}
        className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-primary-100 dark:hover:bg-primary-700/30"
        aria-label={`Quitar filtro: ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DenunciaList() {
  const navigate = useNavigate()
  const { denuncias, stats } = useDenuncias()

  // Categorías dinámicas derivadas de las denuncias cargadas desde el backend
  const categoryOptions = useMemo(
    () => [...new Set(denuncias.map((d) => d.categoria).filter(Boolean))].map((c) => ({ value: c, label: c })),
    [denuncias]
  )

  // ── Filter state ──────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState('todas')
  const [search,         setSearch]         = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [areaFilter,     setAreaFilter]     = useState('')
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [showFilters,    setShowFilters]    = useState(false)
  const [sorting,        setSorting]        = useState([{ id: 'fecha', desc: true }])

  const tableRef       = useRef(null)
  const filterPanelRef = useRef(null)

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const STATUS_TABS = [
    { value: 'todas',                    label: 'Todas',      count: stats.total      },
    { value: DENUNCIA_STATUS.PENDIENTE,  label: 'Pendientes', count: stats.pendientes },
    { value: DENUNCIA_STATUS.EN_PROCESO, label: 'En Proceso', count: stats.enProceso  },
    { value: DENUNCIA_STATUS.RESUELTA,   label: 'Resueltas',  count: stats.resueltas  },
    { value: DENUNCIA_STATUS.RECHAZADA,  label: 'Rechazadas', count: stats.rechazadas },
  ]

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasActiveFilters = !!(priorityFilter || categoryFilter || areaFilter || dateFrom || dateTo)
  const filterCount = [priorityFilter, categoryFilter, areaFilter, dateFrom, dateTo].filter(Boolean).length

  const clearAllFilters = () => {
    setPriorityFilter('')
    setCategoryFilter('')
    setAreaFilter('')
    setDateFrom('')
    setDateTo('')
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = [...denuncias]

    if (activeTab !== 'todas')
      data = data.filter((d) => d.estado === activeTab)
    if (priorityFilter)
      data = data.filter((d) => d.prioridad === priorityFilter)
    if (categoryFilter)
      data = data.filter((d) => d.categoria === categoryFilter)
    if (areaFilter)
      data = data.filter((d) => d.area === areaFilter)
    if (dateFrom) {
      const from = dayjs(dateFrom).startOf('day').valueOf()
      data = data.filter((d) => dayjs(d.fecha).valueOf() >= from)
    }
    if (dateTo) {
      const to = dayjs(dateTo).endOf('day').valueOf()
      data = data.filter((d) => dayjs(d.fecha).valueOf() <= to)
    }

    return data
  }, [denuncias, activeTab, priorityFilter, categoryFilter, areaFilter, dateFrom, dateTo])

  // ── Animations ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!tableRef.current) return
    const rows = tableRef.current.querySelectorAll('tbody tr, [data-mobile-card]')
    if (rows.length) {
      gsap.fromTo(rows,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power3.out' }
      )
    }
  }, [activeTab, categoryFilter, priorityFilter, areaFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!showFilters || !filterPanelRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      filterPanelRef.current,
      { autoAlpha: 0, y: -10 },
      { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }
    )
  }, [showFilters])

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Código',
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium text-primary-600">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'titulo',
        header: 'Título',
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary dark:text-text-dark-primary">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-text-secondary dark:text-text-dark-secondary">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'prioridad',
        header: 'Prioridad',
        size: 100,
        cell: ({ getValue }) => <PriorityIndicator priority={getValue()} />,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 130,
        cell: ({ getValue }) => <StatusBadge status={getValue()} size="sm" />,
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-muted">{dayjs(getValue()).format('DD/MM/YY HH:mm')}</span>
        ),
        sortingFn: 'datetime',
      },
      {
        id: 'acciones',
        header: '',
        size: 80,
        cell: ({ row }) => {
          const d = row.original
          const isResuelta = d.estado === DENUNCIA_STATUS.RESUELTA
          return (
            <div className="flex items-center justify-end gap-0.5">
              {isResuelta && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    try { await complaintService.downloadPdf(d._id, d.id) }
                    catch { /* silencioso */ }
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-success-light hover:text-success"
                  aria-label={`Descargar PDF ${d.id}`}
                  title="Descargar PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/denuncias/${d.id}`)
                }}
                className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-700/15"
                aria-label={`Ver denuncia ${d.id}`}
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  const totalFiltered = table.getFilteredRowModel().rows.length
  const pageStart = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
  const pageEnd   = Math.min(pageStart + table.getState().pagination.pageSize - 1, totalFiltered)

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Denuncias
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            Gestión y seguimiento de denuncias ciudadanas
          </p>
        </div>
        <Button onClick={() => navigate('/denuncias/nueva')}>
          <Plus className="h-4 w-4" />
          Nueva Denuncia
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs tabs={STATUS_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Search + Filter toggle ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, título, ciudadano..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-9 pl-10 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'relative',
            (showFilters || hasActiveFilters) && 'border-primary text-primary dark:border-primary dark:text-primary'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {filterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {filterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Filter Panel ───────────────────────────────────────────────────── */}
      {showFilters && (
        <div
          ref={filterPanelRef}
          className="rounded-xl border border-gray-200 bg-surface-card p-4 dark:border-gray-700 dark:bg-surface-dark-card"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Urgencia
              </label>
              <Select
                options={PRIORITY_OPTIONS}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Categoría
              </label>
              <Select
                placeholder="Todas las categorías"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>

            {/* Area */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Área
              </label>
              <Select
                options={AREA_OPTIONS}
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              />
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <Calendar className="h-3 w-3" />
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className={DATE_INPUT_CLASS}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <Calendar className="h-3 w-3" />
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className={DATE_INPUT_CLASS}
              />
            </div>
          </div>

          {/* Footer row */}
          {hasActiveFilters && (
            <div className="mt-3 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-700/50">
              <button
                onClick={clearAllFilters}
                className="cursor-pointer text-xs font-semibold text-danger transition-colors hover:text-danger/70"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Active filter chips ─────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Filtros activos:</span>
          {priorityFilter && (
            <ActiveChip
              label={PRIORITY_CHIP_LABELS[priorityFilter]}
              onRemove={() => setPriorityFilter('')}
            />
          )}
          {categoryFilter && (
            <ActiveChip label={categoryFilter} onRemove={() => setCategoryFilter('')} />
          )}
          {areaFilter && (
            <ActiveChip label={`Área: ${areaFilter}`} onRemove={() => setAreaFilter('')} />
          )}
          {dateFrom && (
            <ActiveChip
              label={`Desde ${dayjs(dateFrom).format('DD/MM/YY')}`}
              onRemove={() => setDateFrom('')}
            />
          )}
          {dateTo && (
            <ActiveChip
              label={`Hasta ${dayjs(dateTo).format('DD/MM/YY')}`}
              onRemove={() => setDateTo('')}
            />
          )}
        </div>
      )}

      {/* ── Table container ─────────────────────────────────────────────────── */}
      <div
        ref={tableRef}
        className="overflow-hidden rounded-xl border border-gray-200 bg-surface-card dark:border-gray-700 dark:bg-surface-dark-card"
      >
        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-surface-dark-elevated">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted',
                        header.column.getCanSort() && 'cursor-pointer select-none transition-colors hover:text-text-primary dark:hover:text-text-dark-primary'
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc'  && <ChevronUp   className="h-3 w-3 text-primary" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-3 w-3 text-primary" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="mt-3 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">Sin resultados</p>
                    <p className="mt-1 text-xs text-text-muted">No se encontraron denuncias con los filtros actuales.</p>
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="mt-3 cursor-pointer text-sm font-medium text-primary hover:underline">
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/denuncias/${row.original.id}`)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-primary-50/30 active:bg-primary-50/50 dark:border-gray-800 dark:hover:bg-primary-700/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
          {table.getRowModel().rows.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm font-medium text-text-secondary dark:text-text-dark-secondary">Sin resultados</p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="mt-3 cursor-pointer text-sm font-medium text-primary hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const d = row.original
              return (
                <div
                  key={row.id}
                  data-mobile-card
                  onClick={() => navigate(`/denuncias/${d.id}`)}
                  className="cursor-pointer px-4 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-surface-dark-elevated"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-medium text-primary-600">{d.id}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-text-primary dark:text-text-dark-primary">{d.titulo}</p>
                    </div>
                    <StatusBadge status={d.estado} size="sm" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span>{d.categoria}</span>
                    <PriorityIndicator priority={d.prioridad} />
                    <span className="tabular-nums">{dayjs(d.fecha).format('DD/MM HH:mm')}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-xs text-text-muted">
              <span className="hidden sm:inline">Mostrando </span>
              <span className="font-medium text-text-secondary dark:text-text-dark-secondary">{pageStart}–{pageEnd}</span> de{' '}
              <span className="font-medium text-text-secondary dark:text-text-dark-secondary">{totalFiltered}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-text-secondary dark:text-text-dark-secondary">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
