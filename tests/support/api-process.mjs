import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

/** @param {number} port */
export const startApi = async (port) => {
  let child;
  const stop = async () => {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
  };
  /** @param {Record<string, string>} [environment] */
  const restart = async (environment = {}) => {
    await stop();
    child = spawn(
      process.execPath,
      [fileURLToPath(new URL("../../api/server.mjs", import.meta.url))],
      {
        env: {
          ...process.env,
          API_PORT: String(port),
          API_FAIL: "0",
          API_DELAY_MS: "0",
          ...environment,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let errors = "";
    child.stderr.on("data", (data) => {
      errors += data;
    });
    await Promise.race([
      once(child.stdout, "data"),
      once(child, "exit").then(() => {
        throw new Error(errors || "API exited before listening");
      }),
    ]);
  };
  await restart();
  return { url: `http://127.0.0.1:${port}`, restart, stop };
};
