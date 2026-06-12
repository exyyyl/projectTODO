import { useEffect } from "react";

import { isTauri } from "@tauri-apps/api/core";

const UPDATE_CHECK_DELAY_MS = 3_000;

export function DesktopUpdater() {
  useEffect(() => {
    if (!isTauri() || import.meta.env.DEV) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const [{ check }, { relaunch }] = await Promise.all([
          import("@tauri-apps/plugin-updater"),
          import("@tauri-apps/plugin-process"),
        ]);
        const update = await check();

        if (update) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } catch (error) {
        console.error("Не удалось проверить обновления приложения", error);
      }
    }, UPDATE_CHECK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
