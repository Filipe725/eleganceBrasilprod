# Elegance Brasil — Catálogo Digital de Perfumes 🌸

E-commerce no modelo **catálogo digital**: o cliente monta o carrinho no site e
finaliza o pedido pelo **WhatsApp** (sem checkout de pagamento).

## Stack

- **Frontend:** Next.js 14 (App Router) + React + Tailwind CSS + Lucide Icons
- **Estado do carrinho:** Zustand (com persistência em `localStorage`)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)

## Como rodar

### 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas `perfumes`, `banners_seccoes` e `admins`, as políticas de RLS
   e o bucket `perfumes` no Storage. Se o projeto já rodou uma versão anterior do
   schema (sem a tabela `admins`), execute em vez disso
   [`supabase/migrations/003_admin_rls.sql`](supabase/migrations/003_admin_rls.sql).
3. Crie o usuário admin em **Authentication → Users → Add user** (e-mail + senha).
4. **Obrigatório:** autorize esse usuário a escrever no catálogo — a RLS só libera
   `insert`/`update`/`delete` para quem está na tabela `admins`. No SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seuemail@exemplo.com'
   on conflict (user_id) do nothing;
   ```
   Sem esse passo, o login funciona mas toda escrita (perfumes, banners, upload de
   imagem) é bloqueada.
5. Recomendado (defesa extra, não obrigatório): desative **Enable sign ups** em
   Authentication → Providers → Email, para que ninguém consiga se cadastrar sozinho.

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com a URL/anon key do projeto (Project Settings → API), o número do
WhatsApp que recebe os pedidos (ex.: `5511999998888`) e o nome da loja.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

- Loja: [http://localhost:3000](http://localhost:3000)
- Painel admin: [http://localhost:3000/admin](http://localhost:3000/admin) (protegido por login)

## Estrutura do projeto

```
supabase/schema.sql            → Script SQL (tabelas, RLS, Storage)
src/
├── middleware.ts              → Proteção das rotas /admin
├── app/
│   ├── page.tsx               → Home: secções dinâmicas + catálogo
│   ├── layout.tsx             → Layout raiz, fontes e metadata
│   ├── quem-somos/            → Página institucional
│   ├── politica-de-privacidade/
│   ├── perguntas-frequentes/  → FAQ em accordion
│   ├── fale-conosco/          → Contatos (WhatsApp, e-mail, endereço)
│   └── admin/
│       ├── page.tsx           → Dashboard (perfumes + banners)
│       └── login/page.tsx     → Login (Supabase Auth)
├── components/
│   ├── site/                  → Header, Hero, secções, banner, vitrine,
│   │                            filtros, card, PageShell e Footer
│   ├── cart/                  → Botão, gaveta lateral e item do carrinho
│   └── admin/                 → Dashboard com abas, formulário de perfume
│                                e gerenciador de banners/secções
├── lib/
│   ├── supabase/              → Clients (browser, server e middleware)
│   ├── whatsapp.ts            → Gera o link wa.me com o resumo do pedido
│   ├── upload.ts              → Upload de imagens para o Storage
│   ├── format.ts              → Formatação de moeda (BRL)
│   ├── constants.ts           → Config da loja e links institucionais
│   └── types.ts               → Tipos (Perfume, BannerSeccao, CartItem)
└── store/cart-store.ts        → Zustand: estado do carrinho
```

## Secções da Home e banners

- Cada linha de `banners_seccoes` vira uma secção na Home (ex.:
  "OS MAIS VENDIDOS"), na ordem do campo `ordem`.
- O admin envia **2 artes por banner** (horizontal para desktop,
  quadrada para mobile), define o link de destino (âncora `#slug` ou URL)
  e liga/desliga o banner com o toggle — sem apagar os arquivos.
- No cadastro do perfume, o campo **"Secção da Home"** (`tag_destaque`)
  define em qual secção ele aparece; sem tag, ele aparece apenas no
  catálogo geral com filtros.

## Fluxo de compra

1. Cliente navega pela vitrine e filtra por família olfativa.
2. Adiciona perfumes ao carrinho (gaveta lateral, quantidades ajustáveis).
3. Clica em **“Finalizar Pedido pelo WhatsApp”** → o app gera um link
   `https://wa.me/<número>?text=...` com a lista de itens, subtotais e o total
   formatados, abrindo a conversa direto no WhatsApp da loja.
