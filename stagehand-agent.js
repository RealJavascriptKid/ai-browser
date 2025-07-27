// ai-browser-agent.js
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
dotenv.config();

export default class AIBrowserAgent {
  constructor(config = {}) {
    this.headless = config.headless ?? true;
    this.verbose = config.verbose ?? true;
    this.memory = [];
    this.browserTimeout = config.browserTimeout ?? 30000; // Default timeout: 30s
    this.stagehand = null;  // Initialize Stagehand as null
  }

  // Initialize Stagehand browser automation
  async init() {
    if(this.stagehand)
        return; // Prevent re-initialization if already initialized

    this.stagehand = new Stagehand({
      //browserPath: process.env.BROWSER_PATH, // Ensure BROWSER_PATH is defined in .env
      headless: this.headless,
      verbose: this.verbose,
    });

    await this.stagehand.init();
    if (this.verbose) console.log("✅ Stagehand initialized");
  }

  // Close Stagehand and reset memory
  async close() {
    this.clear();
    if (this.stagehand) {
      await this.stagehand.close();
      if (this.verbose) console.log("🛑 Stagehand closed");
    }
  }

  // Clear internal memory
  clear() {
    this.memory = [];
    if (this.verbose) console.log("🧠 Memory cleared");
  }

  // Execute browser actions based on the given prompt
  async execute(userPrompt, options = {}) {
    await this.init();
    this.memory.push({ role: "user", content: userPrompt });

    try {
      // Execute the user-provided task using Stagehand
      const actions = await this.stagehand.execute(userPrompt, options);

      this.memory.push({ role: "assistant", content: actions });

      // Log each action performed
      for (const action of actions) {
        if (this.verbose) {
          console.log(`✅ Action performed: ${action.type} on ${action.selector || action.url}`);
        }

        // Save memory of the action
        this.memory.push({
          role: "tool",
          content: `Action ${action.type} on ${action.selector || action.url} completed.`,
        });
      }

    } catch (error) {
      console.error("❌ Error executing task:", error);
      this.memory.push({ role: "tool", content: `❌ Failed to execute task: ${error.message}` });
    }

    return this.memory;
  }
}
