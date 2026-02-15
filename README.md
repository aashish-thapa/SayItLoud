# SayItLoud

A social media platform built with Next.js 16, React 19, MongoDB, and Tailwind CSS 4.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, Radix UI, Lucide Icons
- **Database:** MongoDB via Mongoose
- **Auth:** JWT + bcryptjs
- **Media:** Cloudinary
- **AI Chat:** Local LLM backend (Llama) via API proxy repo->[ollama-gateway](https://github.com/aashish-thapa/ollama-gateway)

## Getting Started

```bash
npm install
cp .env.example .env.local  # then fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/sayitloud
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
LOCAL_AI_BACKEND_URL=https://your-llm-backend.com
LOCAL_AI_API_KEY=your-ai-api-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Lint with ESLint |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login, signup pages
│   ├── (main)/           # Main layout (feed, explore, profile)
│   └── api/              # API routes (chat, health, auth, posts)
├── components/
│   ├── ui/               # Shadcn UI primitives
│   ├── layout/           # Navbar, sidebars, widgets
│   ├── chat/             # AI chatbot widget
│   ├── feed/             # Post cards, comments
│   └── profile/          # Profile components
├── contexts/             # Auth, Theme providers
├── lib/                  # Utils, DB, hooks, auth helpers
├── models/               # Mongoose models (User, Post, Notification)
└── types/                # TypeScript types
```
