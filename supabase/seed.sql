-- Demo seed data for Trampa: fake providers, clients, listings (with tags),
-- photos, reviews and category covers — enough to make the app feel alive.
--
-- Idempotent: re-running wipes the previous demo data (everything tied to the
-- @trampademo.com accounts cascades away) and recreates it.
--
-- Images use LoremFlickr keyword URLs (loaded directly by the browser, no API
-- key required). To swap them for real Pixabay photos, see the notes in the
-- README / project docs.
--
-- Run AFTER migrations 0001–0011 have been applied.

-- 1) Clean previous demo data (cascades to profiles/services/photos/contracts/reviews)
delete from auth.users where email like '%@trampademo.com';

-- 2) Providers + clients (profiles are auto-created by the on_auth_user_created trigger)
do $$
declare
  pwd text := crypt('trampa123', gen_salt('bf'));
  uid uuid;
  i int;
  providers text[] := array[
    'Marina Oliveira','Carlos Eduardo Santos','Juliana Rocha','Rafael Almeida',
    'Patrícia Mendes','Bruno Carvalho','Fernanda Lima','Diego Nascimento',
    'Camila Ferreira','Thiago Souza','Aline Barbosa','Gustavo Pereira',
    'Renata Castro','Marcelo Ribeiro'
  ];
  bios text[] := array[
    'Profissional dedicada, mais de 8 anos de experiência e clientes fiéis.',
    'Orçamento transparente e pontualidade. Atendo toda a Grande SP.',
    'Capricho nos detalhes e garantia no serviço. Bora resolver!',
    'Trabalho limpo, organizado e com materiais de qualidade.',
    'Atendimento humanizado e preço justo. Sua satisfação em primeiro lugar.',
    'Experiência comprovada e referências de clientes anteriores.',
    'Rapidez e qualidade. Disponível inclusive aos finais de semana.',
    'Especialista na área, sempre buscando o melhor resultado.',
    'Compromisso com prazos e total transparência no orçamento.',
    'Atendo emergências. Resolvo o seu problema com agilidade.',
    'Mais de uma década no ramo, milhares de serviços concluídos.',
    'Profissional certificado, foco em segurança e durabilidade.',
    'Cuidado e atenção em cada detalhe do seu projeto.',
    'Qualidade premium com o melhor custo-benefício da região.'
  ];
  clients text[] := array[
    'Ana Paula','João Vitor','Beatriz Costa','Lucas Martins','Sofia Andrade','Pedro Henrique'
  ];
begin
  for i in 1..array_length(providers,1) loop
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'prov' || i || '@trampademo.com', pwd, now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', providers[i]), now() - (i || ' days')::interval, now(),
      '', '', '', ''
    );
    update public.profiles set
      is_provider = true, city = 'São Paulo', state = 'SP', bio = bios[i],
      avatar_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=' || replace(providers[i], ' ', '')
    where id = uid;
  end loop;

  for i in 1..array_length(clients,1) loop
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'cli' || i || '@trampademo.com', pwd, now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', clients[i]), now() - (i || ' days')::interval, now(),
      '', '', '', ''
    );
    update public.profiles set
      city = 'São Paulo', state = 'SP',
      avatar_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=' || replace(clients[i], ' ', '')
    where id = uid;
  end loop;
end $$;

-- 3) Listings: ~3-4 per category, around São Paulo, with tags; some featured.
create temp table seed_listings(cat_slug text, title text, descr text, tags text[], price numeric, ptype text, featured boolean) on commit drop;
insert into seed_listings values
('cleaning','Faxina residencial completa','Deixo sua casa impecável: cozinha, banheiros, quartos e áreas comuns. Produtos inclusos.', array['residencial','semanal','produtos inclusos'],180,'fixed',true),
('cleaning','Limpeza pós-obra pesada','Removo respingos de tinta, cimento e poeira fina. Sua obra entregue pronta para morar.', array['pós-obra','pesada'],350,'fixed',false),
('cleaning','Diarista por período','Atendo meio período ou diária completa, com passadoria opcional.', array['diária','passadoria'],130,'fixed',false),
('cleaning','Higienização de estofados e sofás','Limpeza profunda a seco e com extração. Remove manchas e odores.', array['estofados','higienização'],220,'fixed',false),
('plumbing','Conserto de vazamentos e canos','Atendo emergências 24h. Localizo e resolvo vazamentos sem quebra-quebra.', array['vazamento','emergência','24h'],150,'hourly',true),
('plumbing','Instalação de torneiras e chuveiros','Troca e instalação de metais, registros e chuveiros com garantia.', array['instalação','hidráulica'],120,'fixed',false),
('plumbing','Desentupimento de pias e ralos','Desentupimento rápido com equipamento profissional. Sem sujeira.', array['desentupimento','urgente'],180,'fixed',false),
('electrical','Instalação elétrica residencial','Tomadas, interruptores e fiação dentro das normas. Segurança em primeiro lugar.', array['instalação','tomadas','segurança'],200,'hourly',true),
('electrical','Troca de disjuntores e quadro','Modernizo seu quadro de luz e elimino quedas de energia.', array['quadro','disjuntor'],250,'fixed',false),
('electrical','Instalação de chuveiro e ventilador','Instalo chuveiros potentes e ventiladores de teto com fixação reforçada.', array['chuveiro','ventilador'],130,'fixed',false),
('painting','Pintura de apartamentos e casas','Acabamento liso e uniforme, proteção de móveis e limpeza no final.', array['parede','interno','acabamento'],1200,'quote',true),
('painting','Textura e grafiato decorativo','Efeitos decorativos que valorizam o ambiente. Várias cores e estilos.', array['textura','decorativo'],900,'quote',false),
('painting','Pintura de portões e grades','Lixamento, antiferrugem e esmalte de alta durabilidade.', array['externo','esmalte'],400,'fixed',false),
('gardening','Manutenção de jardim e poda','Deixo seu jardim sempre bonito: poda, adubação e controle de pragas.', array['poda','jardim','mensal'],160,'fixed',true),
('gardening','Corte de grama e roçada','Gramado nivelado e limpo. Recolho os resíduos.', array['grama','roçada'],90,'fixed',false),
('gardening','Paisagismo e projeto verde','Crio projetos de paisagismo do conceito à execução.', array['paisagismo','projeto'],1500,'quote',false),
('moving','Frete e mudança residencial','Caminhão, equipe e montagem inclusos. Cuidado total com seus móveis.', array['frete','carreto','montagem'],350,'quote',true),
('moving','Carreto rápido com ajudante','Ideal para pequenas mudanças e entregas. Preço justo.', array['carreto','ajudante'],200,'fixed',false),
('moving','Transporte de móveis e eletrodomésticos','Transporto com segurança, embalagem e içamento quando necessário.', array['transporte','móveis'],250,'fixed',false),
('tech-repair','Conserto de notebooks e PCs','Formatação, upgrade de SSD/memória e limpeza interna. Orçamento grátis.', array['notebook','formatação','upgrade'],120,'fixed',true),
('tech-repair','Reparo de celulares e tablets','Troca de tela, bateria e conectores. Peças com garantia.', array['celular','tela','bateria'],150,'fixed',false),
('tech-repair','Instalação de câmeras e CFTV','Monitore sua casa pelo celular. Instalação e configuração completas.', array['cftv','câmeras','segurança'],600,'quote',false),
('beauty','Cabeleireira a domicílio','Corte, escova e coloração no conforto da sua casa.', array['cabelo','corte','domicílio'],90,'fixed',true),
('beauty','Manicure e pedicure completa','Mão e pé caprichados, com esmaltação em gel opcional.', array['unhas','manicure'],60,'fixed',false),
('beauty','Maquiagem para eventos','Make para festas, formaturas e noivas. Realço sua beleza natural.', array['maquiagem','festa','noiva'],250,'fixed',false),
('tutoring','Reforço de matemática e física','Aulas particulares focadas em ENEM e vestibulares. Online ou presencial.', array['matemática','física','enem'],80,'hourly',true),
('tutoring','Aulas de inglês conversação','Do básico ao avançado, com foco em fluência e conversação.', array['inglês','conversação','online'],70,'hourly',false),
('tutoring','Aulas de violão para iniciantes','Aprenda suas músicas favoritas desde a primeira aula.', array['violão','música'],60,'hourly',false),
('pet-care','Banho e tosa a domicílio','Seu pet limpo e cheiroso sem o estresse do transporte.', array['banho','tosa','higiene'],80,'fixed',true),
('pet-care','Dog walker e creche','Passeios diários e creche com fotos e atualizações pra você.', array['passeio','creche'],40,'fixed',false),
('pet-care','Adestramento básico de cães','Ensino comandos e corrijo comportamentos com reforço positivo.', array['adestramento','comportamento'],150,'fixed',false),
('events','Buffet e finger food para festas','Salgados, doces e finger food artesanais para seu evento.', array['buffet','festa','salgados'],1200,'quote',true),
('events','DJ e som para eventos','Som de qualidade, iluminação e repertório do seu jeito.', array['dj','som','iluminação'],800,'quote',false),
('events','Decoração de festas infantis','Temas personalizados que encantam a criançada.', array['decoração','infantil'],600,'quote',false),
('other','Montagem de móveis planejados','Monto guarda-roupas, cozinhas e estantes com precisão.', array['montagem','móveis','marcenaria'],150,'fixed',true),
('other','Marido de aluguel - pequenos reparos','Resolvo aquela listinha de reparos: prateleiras, fixações e mais.', array['reparos','fixação','prateleira'],100,'hourly',false),
('other','Chaveiro 24h e troca de fechaduras','Abertura, troca e instalação de fechaduras. Atendimento 24 horas.', array['chaveiro','fechadura','24h'],120,'fixed',false);

with provs as (
  select id, (row_number() over (order by created_at)) - 1 as rn from public.profiles where is_provider
),
nprov as (select count(*)::int as cnt from public.profiles where is_provider),
listings as (select *, (row_number() over ()) - 1 as idx from seed_listings)
insert into public.services
  (provider_id, category_id, title, description, price, price_type, status, address, city, state, lat, lng, tags, is_featured)
select
  p.id, c.id, l.title, l.descr, l.price, l.ptype, 'approved',
  'Rua das Acácias, ' || (100 + l.idx)::text, 'São Paulo', 'SP',
  -23.5505 + (random() - 0.5) * 0.16,
  -46.6333 + (random() - 0.5) * 0.16,
  l.tags, l.featured
from listings l
join public.categories c on c.slug = l.cat_slug
cross join nprov
join provs p on p.rn = (l.idx % nprov.cnt);

-- 4) Photos: 3 thematic images per listing, stable per (service, position).
with kw(slug, tags) as (values
  ('cleaning','cleaning,housekeeping'),('plumbing','plumber,plumbing'),
  ('electrical','electrician,electrical'),('painting','painting,wall'),
  ('gardening','gardening,garden'),('moving','moving,boxes'),
  ('tech-repair','computer,repair'),('beauty','salon,hairstyle'),
  ('tutoring','teacher,study'),('pet-care','dog,grooming'),
  ('events','party,celebration'),('other','tools,handyman')
)
insert into public.service_photos (service_id, url, position)
select
  s.id,
  'https://loremflickr.com/640/480/' || kw.tags || '?lock=' || (abs(hashtext(s.id::text || g.pos::text)) % 100000)::text,
  g.pos
from public.services s
join public.categories c on c.id = s.category_id
join kw on kw.slug = c.slug
cross join generate_series(0, 2) as g(pos)
where s.provider_id in (select id from auth.users where email like 'prov%@trampademo.com');

-- 5) Reviews (via completed contracts) so ratings populate through the trigger.
do $$
declare
  s record; n int; k int; rid uuid; cids uuid[]; rating int; cid uuid;
  comments text[] := array[
    'Serviço impecável, recomendo demais!',
    'Pontual e muito caprichoso no acabamento.',
    'Resolveu rápido e cobrou um preço justo.',
    'Profissional super atencioso, vou contratar de novo.',
    'Ficou perfeito, melhor do que eu esperava.',
    'Excelente atendimento do início ao fim.',
    'Muito educado e organizado, adorei o resultado.',
    'Cumpriu tudo o que prometeu, nota 10.',
    'Trabalho limpo e bem feito, sem dor de cabeça.',
    'Atendeu de última hora e salvou o meu dia.'
  ];
  ratings int[] := array[5,5,5,4,4,5,3,5,4,5];
begin
  select array_agg(p.id) into cids
  from public.profiles p join auth.users u on u.id = p.id
  where u.email like 'cli%@trampademo.com';

  for s in
    select id, provider_id from public.services
    where provider_id in (select id from auth.users where email like 'prov%@trampademo.com')
  loop
    n := 2 + floor(random() * 5)::int;
    for k in 1..n loop
      cid := cids[1 + ((k - 1) % array_length(cids, 1))];
      rating := ratings[1 + floor(random() * array_length(ratings, 1))::int];
      insert into public.contracts (id, service_id, client_id, provider_id, status, created_at, updated_at)
        values (gen_random_uuid(), s.id, cid, s.provider_id, 'completed', now() - (k || ' days')::interval, now())
        returning id into rid;
      insert into public.reviews (contract_id, service_id, client_id, provider_id, rating, comment, created_at)
        values (rid, s.id, cid, s.provider_id, rating, comments[1 + floor(random() * array_length(comments, 1))::int], now() - (k || ' days')::interval);
    end loop;
  end loop;
end $$;

-- 6) Category cover images for the landing page.
with kw(slug, tags) as (values
  ('cleaning','cleaning,housekeeping'),('plumbing','plumber,plumbing'),
  ('electrical','electrician,electrical'),('painting','painting,wall'),
  ('gardening','gardening,garden'),('moving','moving,boxes'),
  ('tech-repair','computer,repair'),('beauty','salon,hairstyle'),
  ('tutoring','teacher,study'),('pet-care','dog,grooming'),
  ('events','party,celebration'),('other','tools,handyman')
)
update public.categories c
set cover_url = 'https://loremflickr.com/400/300/' || kw.tags || '?lock=' || (abs(hashtext(c.slug)) % 100000)::text
from kw where kw.slug = c.slug;
