# ExamForge — Frontend

React 18 + TypeScript + Vite 5 + Tailwind CSS 3 frontend for the ExamForge virtual exam platform.

## Stack

| Lib | Purpose |
|-----|---------|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 5 | Dev server & bundler |
| Tailwind CSS 3 | Styling |
| React Router DOM 6 | Routing |
| Axios | HTTP client |
| Zustand + persist | Auth state (localStorage) |
| TanStack React Query 5 | Server state & caching |
| React Hook Form + Zod | Form validation |
| KaTeX | LaTeX rendering |
| lucide-react | Icons |

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL if needed
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` to `http://localhost:8000`.

## Project structure

```
src/
├── App.tsx              # Route definitions
├── main.tsx             # Entry point (QueryClient, BrowserRouter)
├── index.css            # Tailwind directives
├── vite-env.d.ts        # Vite type declarations
├── components/
│   ├── ui/              # Button, Input, Modal, Card, Table, ...
│   ├── Layout/          # AppLayout, Sidebar, Navbar
│   ├── AlternativeManager/
│   ├── AnswerKeyTable/
│   ├── ExamConfigForm/
│   ├── ImageUploader/
│   └── LatexEditor/
├── hooks/               # useAuth, useTopics, useQuestions, useExams, useVersions
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Topics/
│   ├── QuestionBank/
│   ├── ExamBuilder/
│   ├── VersionGenerator/
│   └── ExamPreview/
├── services/            # Axios service layer
├── store/               # Zustand authStore
├── types/               # TypeScript interfaces
└── utils/               # latex, validators, downloadFile
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | JWT login (email + password) |
| `/dashboard` | DashboardPage | Stats overview |
| `/topics` | TopicsPage | CRUD topics |
| `/questions` | QuestionBankPage | CRUD questions, import .docx/.pdf |
| `/exams/new` | ExamBuilderPage | Create exam with config + topics |
| `/exams/:id/edit` | ExamBuilderPage | Edit exam metadata |
| `/exams/:id/versions` | VersionGeneratorPage | Generate & download versions |
| `/versions/:id/preview` | ExamPreviewPage | Full exam preview + answer key |

## Build

```bash
npm run build    # produces dist/
npm run preview  # preview the production build
```
