import fs from "node:fs";
import path from "node:path";

/** Serverless (Vercel/Lambda) — el código desplegado no es escribible. */
export function canWriteLocalProjectFiles(): boolean {
  if (process.env.VERCEL === "1") return false;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  if (process.env.NETLIFY) return false;
  return true;
}

export function tryWriteFile(filePath: string, data: string | Buffer): boolean {
  if (!canWriteLocalProjectFiles()) return false;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
    return true;
  } catch {
    return false;
  }
}
