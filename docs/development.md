# Локальная разработка

## Интерфейс

Браузерный режим не требует Rust и подходит для основной работы над UI:

```powershell
pnpm dev:web
```

## Desktop-приложение

```powershell
pnpm dev
```

Для Tauri на Windows нужны Rust, Microsoft C++ Build Tools и Windows SDK.
Текущая машина видит `link.exe`, но не находит `msvcrt.lib`. Перед первой
desktop-сборкой нужно добавить Windows SDK через Visual Studio Installer.

## Проверки

```powershell
pnpm build
cargo fmt --check --manifest-path apps/client/src-tauri/Cargo.toml
cargo check --manifest-path apps/client/src-tauri/Cargo.toml
```
