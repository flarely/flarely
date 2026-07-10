import { createInterface, type Interface } from "readline";
import { lang } from "../lang/index.js";

let _rl: Interface | null = null;

function getRl(): Interface {
  if (!_rl) {
    _rl = createInterface({ input: process.stdin, output: process.stdout });
  }
  return _rl;
}

export function ask(question: string): Promise<string> {
  return new Promise((resolve) =>
    getRl().question(question, (a) => resolve(a.trim()))
  );
}

export async function choose<T extends string>(
  question: string,
  options: T[]
): Promise<T> {
  const listed = options.map((o, i) => `  ${i + 1}. ${o}`).join("\n");
  while (true) {
    const raw = await ask(`${question}\n${listed}\n> `);
    const idx = parseInt(raw) - 1;
    if (idx >= 0 && idx < options.length) return options[idx];
    console.log(lang.invalidChoice);
  }
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await ask(`${question} (y/N): `);
  return answer.toLowerCase() === "y";
}

export function closePrompt(): void {
  _rl?.close();
  _rl = null;
}
