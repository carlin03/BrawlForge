import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 300;

async function isAdmin(): Promise<boolean> {
  return process.env.NEXT_PUBLIC_DEMO_ADMIN === "true";
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Solo en modo demo admin (NEXT_PUBLIC_DEMO_ADMIN=true)" }, { status: 403 });
  }

  const { script } = await request.json();
  const map: Record<string, string> = {
    brand: "npm run logos:brand",
    bsc: "npm run logos:bsc",
    tournaments: "npm run logos:tournaments",
  };
  const cmd = map[script];
  if (!cmd) return NextResponse.json({ error: "Script inválido" }, { status: 400 });

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 280_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return NextResponse.json({
      message: `Ejecutado: ${cmd}`,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-500),
    });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      { error: err.message || "Falló", stdout: err.stdout?.slice(-1000), stderr: err.stderr?.slice(-500) },
      { status: 500 },
    );
  }
}
