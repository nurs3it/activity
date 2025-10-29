# GitLab Dev Dashboard

Дашборд для визуализации метрик и активности разработки из GitLab Community Edition.

## Технологии

- **Next.js 15** (App Router)
- **React 18**
- **TypeScript** (strict mode)
- **Bun** (пакетный менеджер)
- **Tailwind CSS**
- **shadcn/ui** компоненты
- **Framer Motion** (анимации)
- **Recharts** (графики)

## Архитектура

Проект использует Feature-Sliced Design (FSD):

```
src/
├── shared/       # Переиспользуемые модули
│   ├── api/      # API клиенты
│   ├── config/   # Конфигурация
│   ├── lib/      # Утилиты
│   └── ui/       # UI компоненты
├── entities/     # Бизнес-сущности
├── features/     # Функциональные возможности
├── widgets/      # Составные блоки UI
└── pages/        # Страницы приложения
```

## Настройка

1. Установите зависимости:
```bash
bun install
```

2. Создайте файл `.env.local` на основе `.env.example`:
```bash
GITLAB_URL=http://gitlab.nzcs.kz
GITLAB_API_TOKEN=your_personal_access_token_here
GITLAB_API_VERSION=v4
```

3. Запустите dev сервер:
```bash
bun run dev
```

## Получение Personal Access Token

1. Перейдите в GitLab: Settings → Access Tokens
2. Создайте токен с правами `read_api`, `read_repository`
3. Скопируйте токен в `.env.local`

## Структура проекта

- `src/shared/api/gitlab-client.ts` - API клиент для GitLab
- `src/features/projects/` - Функциональность для работы с проектами
- `src/app/` - Страницы Next.js (App Router)

## Разработка

Проект настроен на работу с self-hosted GitLab по адресу `http://gitlab.nzcs.kz`.

Все API запросы автоматически используют конфигурацию из `src/shared/config/gitlab.ts`.
