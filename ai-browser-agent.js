// ai-browser-agent.js
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
dotenv.config();

export default class AIBrowserAgent {
  constructor(config = {}) {
    this.headless = config.headless ?? true;
    this.verbose = config.verbose ?? true;    
    this.browserTimeout = config.browserTimeout ?? 30000; // Default timeout: 30s
    this.stagehand = null; // Initialize Stagehand as null
    this.agent = null;
  }

  // Initialize Stagehand browser automation
  async init() {
      if (this.stagehand) return; // Prevent re-initialization if already initialized

      this.stagehand = new Stagehand({
        env: "LOCAL",
        modelName: "openai/gpt-4.1-mini",
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      });

      await this.stagehand.init();
      this.agent = this.stagehand.agent();
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
    if (this.verbose) console.log("🧠 Memory cleared");
  }

  // Execute browser actions based on the given prompt
  async execute(userPrompt, options = {}) {
    await this.init();
   

    try {
      // Execute the user-provided task using Stagehand
      const result = await this.agent.execute(userPrompt);
      if(result.success)
        if (this.verbose) console.log("✅ Task executed successfully");
      return result //return AI response message

    } catch (error) {
      console.error("❌ Error executing task:", error);
    }

  }
}
