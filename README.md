# Pryysm — 3D Print Farm Management Platform

**Built by 3D Prodigy** | Next.js 15 + Supabase + Vercel

---

## 🚀 Quick Deploy (5 minutes)

### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **Project Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Go to **Authentication → Settings** → Add your Vercel domain to "Site URL" after deployment

### Step 2: Get Anthropic API Key (for AI Chat)

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Create a new API key → `ANTHROPIC_API_KEY`

### Step 3: Deploy to Vercel

#### Option A — GitHub (Recommended)
```bash
git init
git add .
git commit -m "Initial Pryysm deployment"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/pryysm.git
git push -u origin main
```
Then go to [vercel.com](https://vercel.com) → Import → select your repo → add env vars → Deploy

#### Option B — Vercel CLI
```bash
npm install -g vercel
vercel deploy
```

### Step 4: Add Environment Variables in Vercel

In your Vercel project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### Step 5: Update Supabase Auth Settings

After deploying, copy your Vercel URL (e.g. `https://pryysm.vercel.app`) and add it to:
- Supabase → Authentication → URL Configuration → Site URL

---

## 🏗️ Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase + Anthropic keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Default Access

| Type | Email | Password |
|---|---|---|
| Demo (no account) | — | Click "Try Demo" on login page |
| Real account | Sign up via /signup | Your chosen password |

---

## 📦 Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Auth**: Supabase Auth (email/password + magic link)
- **Database**: localStorage (per user, client-side)
- **AI Chat**: Anthropic Claude API (claude-haiku)
- **Deployment**: Vercel (zero-config)

---

## 🗂️ Project Structure

```
src/
  app/                    # Next.js App Router pages
    dashboard/            # Main dashboard
    orders/               # Order management
    customers/            # Customer directory
    tracking/             # Kanban board
    job-allotment/        # Job queue & printer assignment
    printers/             # Printer status
    add-remove-printer/   # Fleet management
    raw-material/         # Spools, resins, powders
    material-log/         # Material audit
    inventory/            # Spares & stores
    order-dispatch/       # Shipping labels
    ai-chat/              # AI assistant
    api/chat/             # Anthropic API proxy
  components/
    layout/               # Sidebar, app wrapper
    ui/                   # Reusable UI components
  hooks/
    use-auth.tsx          # Supabase auth
    use-workspace.tsx     # All workspace state
    workspace-data.ts     # Data types & generators
```

---

## 📋 Modules

| Module | Description |
|---|---|
| Dashboard | Stats, recent orders, printer status |
| Project Tracking | Drag-and-drop Kanban (5 stages) |
| Orders | Full CRUD, status updates, filtering |
| Customers | Directory with document history |
| Job Allotment | Auto & manual job-to-printer assignment |
| Printer Management | Live status, progress tracking |
| Add/Remove Printer | Fleet management |
| Raw Material | Spools, resins, powders tracking |
| Material Log | Full material audit |
| Spares & Stores | Inventory management |
| Order Dispatch | Shipping label generation |
| AI Chat | Claude-powered farm assistant |
