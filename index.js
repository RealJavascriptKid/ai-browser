// ai-browser-agent.js
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
dotenv.config();

class AIBrowserAgent {
  constructor(config = {}) {
    this.stagehand = new Stagehand({
      apiKey: process.env.OPENAI_API_KEY,
      ...config,
      modelName: config.modelName || "openai/gpt-4o",
      env: config.env || "LOCAL",
      headless: config.headless !== false // default true
    });
    this.initialized = false;
    this.defaultWaitConditions = ['networkidle'];
    this.defaultTimeout = 30000; // 30 seconds
  }

  async initialize() {
    if (!this.initialized) {
      await this.stagehand.init();
      this.initialized = true;
      console.log("Stagehand initialized");
    }
    return this;
  }

  async executeTask(userPrompt, options = {}) {
    try {
      await this.initialize();
      
      const page = this.stagehand.page;
      const agent = this.stagehand.agent();

      // Handle URL navigation if provided
      if (options.url) {
        console.log(`Navigating to: ${options.url}`);
        await page.goto(options.url, {
          timeout: options.timeout || this.defaultTimeout,
          waitUntil: options.waitConditions || this.defaultWaitConditions
        });
      }

      // Execute the AI command
      console.log(`Executing: "${userPrompt}"`);
      const result = await agent.execute(userPrompt);
      
      // Additional wait if specified
      if (options.postDelay) {
        await page.waitForTimeout(options.postDelay);
      }

      return {
        success: true,
        message: "Task completed successfully",
        result
      };
    } catch (error) {
      console.error("Error executing task:", error);
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  async close() {
    if (this.initialized) {
      await this.stagehand.close();
      this.initialized = false;
      console.log("Browser closed");
    }
  }
}

// Example usage
(async () => {
  const aiAgent = new AIBrowserAgent({
    headless: false, // Show browser window
    modelName: "openai/gpt-4-turbo", // Alternative model
    browserPath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });

  try {
    // Example 1: YouTube subscription
    await aiAgent.executeTask(
      "Find and navigate to MrBeast's YouTube channel and Subscribe to it", 
      {
        url: "https://www.youtube.com",
        postDelay: 2000 // Wait 2 seconds after completion
      }
    );

    // Example 2: Google search (showing how to chain tasks)
    const searchResult = await aiAgent.executeTask(
      "Search for 'latest AI advancements 2024' and summarize the first page results",
      {
        url: "https://www.google.com",
        waitConditions: ['load', 'networkidle']
      }
    );
    
    console.log("Search Summary:", searchResult.result);

  } catch (error) {
    console.error("Main error:", error);
  } finally {
    await aiAgent.close();
  }
})();