import fs from "fs";
import path from "path";

const promptPath = path.join(process.cwd(), "lib", "prompt_text.txt");
export const SYSTEM_PROMPT = fs.existsSync(promptPath)
  ? fs.readFileSync(promptPath, "utf8")
  : "You are a helpful creative writing assistant.";
