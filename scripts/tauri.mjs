import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const tauriArgs = process.argv.slice(2);

if (tauriArgs.length === 0) {
  console.error("Usage: node scripts/tauri.mjs <dev|build> [...args]");
  process.exit(1);
}

const pnpmCommand = `pnpm --dir apps/client tauri ${tauriArgs.join(" ")}`;

const windowsVcVarsCandidates = [
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\VC\\Auxiliary\\Build\\vcvars64.bat",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Auxiliary\\Build\\vcvars64.bat",
];

let command;
let args;
let useShell = false;

if (process.platform === "win32") {
  const vcVarsPath = windowsVcVarsCandidates.find(existsSync);

  if (!vcVarsPath) {
    console.error(
      "Visual Studio 2022 C++ Build Tools не найдены. Установите workload «Desktop development with C++»."
    );
    process.exit(1);
  }

  command = `call "${vcVarsPath}" >nul && ${pnpmCommand}`;
  args = [];
  useShell = true;
} else {
  command = "pnpm";
  args = ["--dir", "apps/client", "tauri", ...tauriArgs];
}

const child = spawn(command, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: useShell,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
