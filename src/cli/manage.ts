import { choose, closePrompt } from "./utils/index.js";
import { lang } from "./lang/index.js";
import { logger } from "../logger.js";
import {
  listProjects,
  createProject,
  addApiKey,
  revokeApiKey,
  deleteProject,
} from "./actions/index.js";

const MENU = [
  "List projects",
  "Create a new project",
  "Add an API key to a project",
  "Revoke an API key",
  "Delete a project",
  "Exit",
] as const;

async function main() {
  console.log(lang.manage.banner);

  while (true) {
    const choice = await choose(lang.prompt.whatToDo, [...MENU]);

    switch (choice) {
      case "List projects":               await listProjects();  break;
      case "Create a new project":        await createProject(); break;
      case "Add an API key to a project": await addApiKey();     break;
      case "Revoke an API key":           await revokeApiKey();  break;
      case "Delete a project":            await deleteProject(); break;
      case "Exit":
        closePrompt();
        console.log(lang.manage.bye);
        process.exit(0);
    }
  }
}

main().catch((err) => {
  logger.error("Fatal error", err);
  process.exit(1);
});
