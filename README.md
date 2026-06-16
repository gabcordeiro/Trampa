# Trampa

Marketplace de serviços locais conectando clientes a prestadores. Cadastro de anúncios com portfólio de fotos, busca por categoria e raio de distância no mapa, contratação com fluxo de status, chat em tempo real e avaliações.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS v4 + componentes baseados em Radix UI (estilo shadcn/ui)
- **Backend**: Supabase (Auth, Postgres + PostGIS, Storage, Realtime)
- **Mapas**: Mapbox via `react-map-gl`
- **Formulários**: react-hook-form + zod
- **Roteamento**: React Router

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com) e rode as migrations em `supabase/migrations` (em ordem) via SQL Editor ou `supabase db push`.
2. Crie uma conta no [Mapbox](https://mapbox.com) e gere um access token público.
3. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_MAPBOX_TOKEN=
   ```
4. Instale as dependências e rode o projeto:
   ```bash
   npm install
   npm run dev
   ```

## Estrutura

```
src/
  components/   # UI (shadcn-style), layout, e componentes de domínio (chat, contratos, mapa, serviços)
  context/      # AuthContext (sessão + perfil Supabase)
  hooks/        # data hooks (services, contracts, messages, reviews, profile, geolocation)
  lib/          # cliente Supabase e utilitários
  pages/        # rotas da aplicação
  types/        # tipos do banco de dados (espelham o schema Supabase)
supabase/
  migrations/   # schema SQL + RLS policies, em ordem de aplicação
```

## Banco de dados e RLS

As migrations criam `profiles`, `categories`, `services`, `service_photos`, `contracts`, `messages` e `reviews`, todas com Row Level Security habilitada:

- Anúncios (`services`) com status `approved` são públicos; apenas o `provider_id` dono pode editar/excluir os próprios.
- Mensagens (`messages`) só são visíveis e enviáveis pelos participantes do contrato (cliente e prestador).
- Reviews só podem ser criadas pelo cliente de um contrato com status `completed`.

Busca por proximidade usa a função `nearby_services` (PostGIS `ST_DWithin`/`ST_Distance`).
