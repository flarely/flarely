export const en = {
  aborted: "  Aborted.\n",
  invalidChoice: "  Invalid choice, try again.\n",
  dbError: "  Something went wrong. Check logs for details.\n",
  noProjects: "\n  No projects found. Create one first.\n",
  noProjectsShort: "\n  No projects found.\n",

  prompt: {
    projectName: "Project name: ",
    selectProject: "Select project:",
    selectProjectToDelete: "Select project to delete:",
    destinationType: "\nDestination type:",
    webhookUrl: "Webhook URL: ",
    emailTo: "Send alerts TO (email address): ",
    emailFrom: "Send alerts FROM (e.g. Flarely <alerts@yourdomain.com>): ",
    botToken: "Bot token: ",
    chatId: "Chat ID: ",
    dedupWindow: "Dedup window in seconds (Enter for default 600): ",
    keyLabel: "Key label (e.g. production, staging): ",
    selectKeyToRevoke: "\nSelect key to revoke:",
    whatToDo: "What do you want to do?",
  },

  setup: {
    banner: "\n🔥  Flarely — First-time Setup\n",
    hint: "  (To manage projects later, run: pnpm manage)\n",
  },

  manage: {
    banner: "\n🔥  Flarely — Project Manager\n",
    bye: "\n  Bye!\n",
  },

  success: {
    projectCreated: (name: string) => `\n  ✅ Project "${name}" created!\n`,
    apiKeyAdded: (name: string, count: number) =>
      `\n  ✅ New API key added to "${name}" (${count} key${count > 1 ? "s" : ""} total)\n`,
    apiKeyRevoked: "\n  ✅ API key revoked. Any requests using it will now return 401.\n",
    projectDeleted: (name: string) => `\n  ✅ Project "${name}" deleted.\n`,
  },

  info: {
    apiKeyOnce: "\n  API Key (shown once — save it now):\n",
    noKeysForProject: (name: string) => `\n  No API keys found for "${name}".\n`,
    projectDetails: (destination: string, dedupWindow: number, projectId: string) =>
      [
        `  Destination : ${destination}`,
        `  Dedup window: ${dedupWindow}s`,
        `  Project ID  : ${projectId}`,
      ].join("\n"),
    listHeader: `  ${"NAME".padEnd(20)} ${"DESTINATION".padEnd(10)} ${"DEDUP".padEnd(8)} KEYS`,
    listSeparator: `  ${"─".repeat(50)}`,
    listEmpty: "\n  No projects yet. Run 'pnpm setup' to create one.\n",
    listRow: (name: string, destination: string, dedupWindow: number, keyCount: number) =>
      `  ${name.padEnd(20)} ${destination.padEnd(10)} ${String(dedupWindow + "s").padEnd(8)} ${keyCount}`,
  },

  confirm: {
    revokeKey: (label: string) =>
      `\n  ⚠️  Revoke key "${label}"? This cannot be undone.`,
    deleteProject: (name: string) =>
      `\n  ⚠️  Delete "${name}"? This removes all its API keys, events, and dedup history.`,
  },
};
