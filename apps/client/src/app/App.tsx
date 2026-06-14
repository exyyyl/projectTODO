import { useEffect, useLayoutEffect, useState } from "react";

import { useAppStore } from "@/app/model/use-app-store";
import { flushPendingNotes, initializeNotes } from "@/entities/note/api/note-repository";
import { DesktopUpdater } from "@/features/updater/DesktopUpdater";
import { AppShell } from "@/widgets/app-shell/AppShell";

export function App() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const haveNotesInitialized = useAppStore((state) => state.haveNotesInitialized);
  const themePreference = useAppStore((state) => state.themePreference);
  const isCompactMode = useAppStore((state) => state.isCompactMode);
  const areAnimationsEnabled = useAppStore((state) => state.areAnimationsEnabled);

  // Fallback: if Zustand persist's onRehydrateStorage never fires, force-hydrate after 1s
  const [hydrationFallback, setHydrationFallback] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!useAppStore.getState().hasHydrated) {
        useAppStore.getState().setHasHydrated(true);
      }
      setHydrationFallback(true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const isReady = hasHydrated || hydrationFallback;

  useEffect(() => {
    if (!hasHydrated || haveNotesInitialized) return;

    const { initializeStoredNotes, notes } = useAppStore.getState();
    void initializeNotes(notes)
      .then(initializeStoredNotes)
      .catch((error) => {
        console.error("Failed to initialize notes storage", error);
        initializeStoredNotes(notes);
      });
  }, [hasHydrated, haveNotesInitialized]);

  useEffect(() => {
    function flushNotesWhenHidden() {
      if (document.visibilityState === "hidden") {
        void flushPendingNotes().catch((error) => console.error("Failed to flush notes", error));
      }
    }

    document.addEventListener("visibilitychange", flushNotesWhenHidden);
    window.addEventListener("pagehide", flushNotesWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", flushNotesWhenHidden);
      window.removeEventListener("pagehide", flushNotesWhenHidden);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    let animationFrame = 0;
    let isInitial = true;

    function applyPreferences() {
      if (isInitial) {
        root.classList.add("theme-transition-blocked");
      }
      const isDark = themePreference === "dark" || (themePreference === "system" && systemTheme.matches);

      root.classList.toggle("dark", isDark);
      root.classList.toggle("reduce-motion", !areAnimationsEnabled);
      root.style.colorScheme = isDark ? "dark" : "light";

      if (isInitial) {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          animationFrame = requestAnimationFrame(() => {
            root.classList.remove("theme-transition-blocked");
            isInitial = false;
          });
        });
      }
    }

    applyPreferences();
    systemTheme.addEventListener("change", applyPreferences);

    return () => {
      cancelAnimationFrame(animationFrame);
      systemTheme.removeEventListener("change", applyPreferences);
    };
  }, [areAnimationsEnabled, isCompactMode, themePreference]);

  if (!isReady || !haveNotesInitialized) {
    return (
      <div className="grid h-full place-items-center bg-background text-sm text-muted-foreground">
        Загружаем данные...
      </div>
    );
  }

  return (
    <>
      <DesktopUpdater />
      <AppShell />
    </>
  );
}
