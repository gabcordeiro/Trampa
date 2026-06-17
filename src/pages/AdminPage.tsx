import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ServiceStatus } from '@/types/database'

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
      .limit(50)

    setServices((data as unknown as ServiceRow[]) ?? [])
    setLoadingServices(false)
  }

  useEffect(() => {
    fetchStats()
    fetchServices()
  }, [])

  const updateStatus = async (serviceId: string, status: ServiceStatus) => {
    setActionLoading(serviceId + status)
    await supabase.from('services').update({ status }).eq('id', serviceId)
    await Promise.all([fetchStats(), fetchServices()])
    setActionLoading(null)
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return
    setActionLoading(serviceId + 'delete')
    await supabase.from('services').delete().eq('id', serviceId)
    await Promise.all([fetchStats(), fetchServices()])
    setActionLoading(null)
  }

  const statCards = [
    { label: 'Total de usuários', count: stats.totalUsers },
    { label: 'Anúncios pendentes', count: stats.pendingServices },
    { label: 'Anúncios ativos', count: stats.approvedServices },
    { label: 'Contratos este mês', count: stats.contractsThisMonth },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Painel Administrativo</h1>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Anúncios</TabsTrigger>
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
          {loadingServices ? (
            <p className="text-muted-foreground">Carregando anúncios...</p>
          ) : (
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
                  {services.map((service) => (
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
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum anúncio encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
