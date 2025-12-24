import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COOKIES_FILE = path.join(__dirname, "loginCookies.json");
export async function saveCookies(cookies: Array<any>) {
  await writeFile(COOKIES_FILE, JSON.stringify(cookies, null, 2));
}

export async function loadCookies(): Promise<Array<any>> {
  try {
    const cookiesString = await readFile(COOKIES_FILE, "utf-8");
    return JSON.parse(cookiesString);
  } catch {
    return [];
  }
}
