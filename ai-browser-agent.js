// ai-browser-agent.js
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
dotenv.config();

export default class AIBrowserAgent {
  constructor(config = {}) {
    this.headless = config.headless ?? true;
    this.useComputerUseModel = config.useComputerUseModel || false;
    this.verbose = config.verbose ?? true;
    this.browserTimeout = config.browserTimeout ?? 30000;
    this.maxSteps = config.maxSteps ?? 20;
    this.instructions = config.instructions || "You are a helpful assistant that can use a web browser. Do not ask follow-up questions.";
    
    this.stagehand = null;
    this.agent = null;

    // 🧠 In-memory context
    this.memory = [];
  }

  async init() {
    if (this.stagehand) return;

    let computerUseSettings = {};
    if (this.useComputerUseModel) {
      computerUseSettings = {
        localBrowserLaunchOptions: {
          viewport: { width: 1024, height: 768 }, // required for computer-use agent
          headless: this.headless,
        }
      };
    }

    this.stagehand = new Stagehand({
      env: "LOCAL",
      modelName: "openai/gpt-4.1-mini",
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY,
      },
      ...computerUseSettings
    });

    await this.stagehand.init();

    if(this.useComputerUseModel){
      this.agent = this.stagehand.agent({
            provider: "openai",
            model: "computer-use-preview",
            instructions: this.instructions,
            options: {
              apiKey: process.env.OPENAI_API_KEY,
            }
          });

          if (this.verbose) console.log("✅ Stagehand initialized with computer-use agent");

    }else{
      this.agent = this.stagehand.agent();

      if (this.verbose) console.log("✅ Stagehand initialized with default agent");
    }    
    
  }

  async close() {
    this.clear();
    if (this.stagehand) {
      await this.stagehand.close();
      if (this.verbose) console.log("🛑 Stagehand closed");
    }
  }

  clear() {
    this.memory = [];
    if (this.verbose) console.log("🧠 Memory cleared");
  }

  async execute(userPrompt) {
    await this.init();

    // 🧠 Include previous interactions in the context
    const memoryContext = this.memory.map(
      ({ input, output }) => `User: ${input}\nAI: ${output}`
    ).join("\n");

    const fullPrompt = memoryContext
      ? `${memoryContext}\nUser: ${userPrompt}\nAI:`
      : `User: ${userPrompt}`;

    try {
      const result = await this.agent.execute(fullPrompt, {
        maxSteps: this.maxSteps,
      });


      if (result.success) {
        if (this.verbose) console.log("✅ Task executed successfully");
        this.memory.push({
          input: userPrompt,
          output: result.message || "[No output]",
        });
      } else {
        if (this.verbose) console.log("⚠️ Agent failed to complete task");
      }

      return result;
    } catch (error) {
      console.error("❌ Error executing task:", error);
    }
  }
}
