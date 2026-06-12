# Выпуск Project TODO

Windows-релизы собираются GitHub Actions после отправки тега вида `v0.1.0`.

## Перед выпуском

1. Обновить одинаковую версию в:
   - `apps/client/package.json`
   - `apps/client/src-tauri/Cargo.toml`
   - `apps/client/src-tauri/tauri.conf.json`
2. Собрать проект командой `pnpm build`.
3. Создать и отправить тег:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

Workflow создаст GitHub Release с Windows installer, подписью и `latest.json`.

## Ключ обновлений

Локальная копия ключа хранится вне репозитория:

- `%USERPROFILE%\.tauri\project-todo.key`
- `%USERPROFILE%\.tauri\project-todo.key.pub`
- `%USERPROFILE%\.tauri\project-todo.key.password`

Приватный ключ и пароль также должны быть сохранены в GitHub Secrets:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Без исходного ключа нельзя подписать обновление для уже установленной версии.

## Приватный репозиторий

GitHub требует авторизацию для скачивания файлов приватного Release. Поэтому
автообновление установленного приложения начнет работать после публикации
репозитория либо переноса `latest.json` и installers на публичный сервер.
