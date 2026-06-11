# Project TODO

Рабочее название local-first приложения для заметок, задач и управляемых
файловых пространств.

## Запуск

```powershell
pnpm install
pnpm dev
```

Для быстрой разработки интерфейса в браузере:

```powershell
pnpm dev:web
```

## Структура

```text
apps/client/          React-интерфейс и Tauri-оболочка
  src/app/            запуск и провайдеры приложения
  src/widgets/        крупные части интерфейса
  src/features/       пользовательские сценарии
  src/entities/       доменные сущности
  src/shared/         общие компоненты и инфраструктура
  src-tauri/          Rust и платформенная интеграция
docs/                 архитектурные решения и продуктовые заметки
```

Текущий прогресс хранится в [ROADMAP.md](./ROADMAP.md).
