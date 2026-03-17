import { spawn } from "child_process";

export function spawnPy(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use "python" for Windows (not python3)
    const python = spawn("python", ["python/extract.py"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString("utf-8");
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString("utf-8");
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(
          new Error(
            `Python did not return valid JSON.\nstdout:\n${stdout}\nstderr:\n${stderr}`
          )
        );
      }
    });

    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();
  });
}