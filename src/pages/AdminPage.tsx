import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ServiceStatus } from '@/types/database'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface ServiceRow {
  id: string
  title: string
  status: ServiceStatus
  category_id: string
  created_at: string
  provider: { full_name: string } | null
  category: { name: string } | null
}

interface Stats {
  totalUsers: number | null
  pendingServices: number | null
  approvedServices: number | null
  contractsThisMonth: number | null
}

interface ChartEntry {
  name: string
  total: number
}

interface StatusEntry {
  name: string
  value: number
  color: string
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
  draft: '#9ca3af',
  paused: '#3b82f6',
}

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
  draft: 'Rascunho',
  paused: 'Pausado',
}

function groupByMonth(items: { created_at: string }[]): ChartEntry[] {
  const months: Record<string, number> = {}
  items?.forEach(item => {
    const d = new Date(item.created_at)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    months[key] = (months[key] ?? 0) + 1
  })
  return Object.entries(months).map(([name, total]) => ({ name, total }))
}

function statusBadgeVariant(status: ServiceStatus) {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'accent'
    case 'rejected':
    case 'paused':
      return 'secondary'
    default:
      return 'outline'
  }
}

function statusLabel(status: ServiceStatus) {
  switch (status) {
    case 'approved':
      return 'Aprovado'
    case 'pending':
      return 'Pendente'
    case 'rejected':
      return 'Rejeitado'
    case 'paused':
      return 'Pausado'
    case 'draft':
      return 'Rascunho'
    default:
      return status
  }
}

const PAGE_SIZE = 20

export function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: null,
    pendingServices: null,
    approvedServices: null,
    contractsThisMonth: null,
  })
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // BI chart data
  const [statusChartData, setStatusChartData] = useState<StatusEntry[]>([])
  const [contractsByMonth, setContractsByMonth] = useState<ChartEntry[]>([])
  const [usersByMonth, setUsersByMonth] = useState<ChartEntry[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all')
  const [searchFilter, setSearchFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(0)

  const fetchStats = async () => {
    setLoadingStats(true)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [usersRes, pendingRes, approvedRes, contractsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
    ])

    setStats({
      totalUsers: usersRes.count,
      pendingServices: pendingRes.count,
      approvedServices: approvedRes.count,
      contractsThisMonth: contractsRes.count,
    })
    setLoadingStats(false)
  }

  const fetchServices = async () => {
    setLoadingServices(true)
    const { data } = await supabase
      .from('services')
      .select('*, provider:profiles!services_provider_id_fkey(full_name), category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(200)

    setServices((data as unknown as ServiceRow[]) ?? [])
    setLoadingServices(false)
  }

  const fetchChartData = async () => {
    setLoadingCharts(true)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [statusRes, contractsRes, usersRes] = await Promise.all([
      supabase.from('services').select('status'),
      supabase
        .from('contracts')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true }),
    ])

    // Services by status
    const statusCounts: Record<string, number> = {}
    statusRes.data?.forEach((s: { status: string }) => {
      statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
    })
    const statusEntries: StatusEntry[] = Object.entries(statusCounts).map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#9ca3af',
    }))
    setStatusChartData(statusEntries)

    setContractsByMonth(groupByMonth((contractsRes.data as { created_at: string }[]) ?? []))
    setUsersByMonth(groupByMonth((usersRes.data as { created_at: string }[]) ?? []))

    setLoadingCharts(false)
  }

  useEffect(() => {
    fetchStats()
    fetchServices()
    fetchChartData()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [statusFilter, searchFilter])

  const updateStatus = async (serviceId: string, status: ServiceStatus) => {
    setActionLoading(serviceId + status)
    await supabase.from('services').update({ status }).eq('id', serviceId)
    await Promise.all([fetchStats(), fetchServices(), fetchChartData()])
    setActionLoading(null)
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return
    setActionLoading(serviceId + 'delete')
    await supabase.from('services').delete().eq('id', serviceId)
    await Promise.all([fetchStats(), fetchServices(), fetchChartData()])
    setActionLoading(null)
  }

  const statCards = [
    { label: 'Total de usuários', count: stats.totalUsers },
    { label: 'Anúncios pendentes', count: stats.pendingServices },
    { label: 'Anúncios ativos', count: stats.approvedServices },
    { label: 'Contratos este mês', count: stats.contractsThisMonth },
  ]

  const filteredServices = services.filter(s =>
    (statusFilter === 'all' || s.status === statusFilter) &&
    (searchFilter === '' || s.title.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  const paginatedServices = filteredServices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Painel Administrativo</h1>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Anúncios</TabsTrigger>
          <TabsTrigger value="bi">BI / Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">
                    {loadingStats ? '—' : (stat.count ?? '—')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceStatus)}
            >
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="paused">Pausado</option>
            </select>
            <input
              type="text"
              placeholder="Buscar por título..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {(statusFilter !== 'all' || searchFilter !== '') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStatusFilter('all'); setSearchFilter('') }}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {loadingServices ? (
            <p className="text-muted-foreground">Carregando anúncios...</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Título</th>
                      <th className="px-4 py-3 text-left font-medium">Prestador</th>
                      <th className="px-4 py-3 text-left font-medium">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Criado em</th>
                      <th className="px-4 py-3 text-left font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedServices.map((service) => (
                      <tr key={service.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{service.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {service.provider?.full_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {service.category?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(service.status)}>
                            {statusLabel(service.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(service.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {service.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                                disabled={actionLoading !== null}
                                onClick={() => updateStatus(service.id, 'approved')}
                              >
                                Aprovar
                              </Button>
                            )}
                            {service.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                disabled={actionLoading !== null}
                                onClick={() => updateStatus(service.id, 'rejected')}
                              >
                                Rejeitar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-400 text-gray-500 hover:bg-gray-50"
                              disabled={actionLoading !== null}
                              onClick={() => deleteService(service.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedServices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum anúncio encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredServices.length)} de {filteredServices.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <span>Página {page + 1} de {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="bi">
          {loadingCharts ? (
            <p className="text-muted-foreground">Carregando dados...</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Pie chart — services by status (full width) */}
              <Card className="md:col-span-2">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-base font-semibold">Anúncios por Status</h3>
                  {statusChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Bar chart — contracts by month */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 text-base font-semibold">Contratos por Mês (últimos 6 meses)</h3>
                  {contractsByMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={contractsByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" name="Contratos" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Bar chart — new users by month */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 text-base font-semibold">Novos Usuários por Mês (últimos 6 meses)</h3>
                  {usersByMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={usersByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" name="Usuários" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
