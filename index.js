// ai-browser-agent.js
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIBrowserAgent {
  constructor(config = {}) {
    this.headless = config.headless ?? true;
    this.model = config.model || "gpt-4o";
    this.browser = null;
    this.page = null;
    this.verbose = config.verbose ?? true;
    this.memory = [];
    this.browserTimeout = config.browserTimeout ?? 30000; // 🔧 Default timeout 30s
  }

  async init() {
    this.#initMemory();
    this.browser = await puppeteer.launch({ headless: this.headless });
    this.page = await this.browser.newPage();
    if (this.verbose) console.log("✅ Browser launched");
  }

  async close() {
    this.clear();
    if (this.browser) {
      await this.browser.close();
      if (this.verbose) console.log("🛑 Browser closed");
    }
  }

  #initMemory(){
     this.memory = [
          {
            role: "system",
            content: `You are a web automation agent. You can interact with the current webpage DOM. Suggest the best next action to achieve the user's instruction.`
          }
        ];
  }

  clear() {
    this.#initMemory();
    if (this.verbose) console.log("🧠 Memory cleared");
  }

  async execute(userPrompt, options = {}) {
    if (!this.browser || !this.page) await this.init();

    if (options.url) {
      await this.page.goto(options.url, { waitUntil: "networkidle0", timeout: this.browserTimeout }); // 🔧
      if (this.verbose) console.log(`🌐 Navigated to: ${options.url}`);
    }

    const domContent = await this.page.content();

    this.memory.push({
      role: "user",
      content: `Instruction: ${userPrompt}\n\nDOM Snapshot:\n${domContent.slice(0, 8000)}...`
    });

    let response;
    try {
      response = await openai.chat.completions.create({
        model: this.model,
        messages: this.memory,
        temperature: 0.2,
        tools: [
          {
            type: "function",
            function: {
              name: "web_action",
              description: "Perform a web automation action",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["click", "type", "navigate"]
                  },
                  selector: {
                    type: "string",
                    description: "CSS selector to act on. URL to navigate to if action is 'navigate'",
                  },
                  text: {
                    type: "string",
                    description: "Text to type (if action is type)",
                    nullable: true
                  }
                },
                required: ["action", "selector"]
              }
            }
          }
        ],
        tool_choice: "auto"
      });
    } catch (err) {
      console.error("❌ OpenAI call failed:", err);
      throw err;
    }

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned by AI");

    const action = JSON.parse(toolCall.function.arguments);
    if (this.verbose) console.log("🤖 AI Action:", action);

    this.memory.push({ role: "assistant", tool_calls: [toolCall] });

    const { action: act, selector, text } = action;
    if (!selector) throw new Error("No selector provided by AI");

    switch (act) {
      case "click":
        await this.page.waitForSelector(selector, { timeout: this.browserTimeout }); // 🔧
        await this.page.click(selector);
        break;
      case "type":
        await this.page.waitForSelector(selector, { timeout: this.browserTimeout }); // 🔧
        await this.page.type(selector, text || "");
        break;
      case "navigate":
        await this.page.goto(selector, { waitUntil: "networkidle0", timeout: this.browserTimeout });
        break;
      default:
        throw new Error(`Unsupported action: ${act}`);
    }

    if (this.verbose) console.log(`✅ Action performed: ${act} on ${selector}`);
  }
}

// Example usage

(async () => {
  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 120000 }); // 🔧 Increased timeout to 120s
  try {
    await agent.execute("Search for MrBeast on YouTube and click his channel", {
      //url: "https://www.youtube.com"
    });
    await agent.execute("Click on the latest video");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await agent.close();
  }
})();
