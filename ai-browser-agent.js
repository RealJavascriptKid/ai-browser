// ai-browser-agent.js
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
dotenv.config();

export default class AIBrowserAgent {
  constructor(config = {}) {
    this.headless = config.headless ?? true;
    this.verbose = config.verbose ?? true;    
    this.browserTimeout = config.browserTimeout ?? 30000;
    this.stagehand = null;
    this.agent = null;

    // 🧠 Memory to store previous interactions
    this.memory = [];
  }

  // Initialize Stagehand browser automation
  async init() {
    if (this.stagehand) return;

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

  // Close Stagehand and clear memory
  async close() {
    this.clear();
    if (this.stagehand) {
      await this.stagehand.close();
      if (this.verbose) console.log("🛑 Stagehand closed");
    }
  }

  // Clear internal memory
  clear() {
    this.memory = []; // 🧠 Clear memory
    if (this.verbose) console.log("🧠 Memory cleared");
  }

  // Execute browser actions based on the given prompt
  async execute(userPrompt) {
    await this.init();

    // 🧠 Compose memory into context
    const memoryContext = this.memory.map(
      ({ input, output }) => `User: ${input}\nAI: ${output}`
    ).join("\n");

    const contextualPrompt = memoryContext
      ? `${memoryContext}\nUser: ${userPrompt}\nAI:`
      : `User: ${userPrompt}\nAI:`;

    try {
      const result = await this.agent.execute(contextualPrompt);

      if (result && result.success) {
        if (this.verbose) console.log("✅ Task executed successfully");

        // 🧠 Store this interaction in memory
        this.memory.push({
          input: userPrompt,
          output: result.message || "[No output]", // Adjust based on actual result shape
        });
      }

      return result;
    } catch (error) {
      console.error("❌ Error executing task:", error);
    }
  }
}
