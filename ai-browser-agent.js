// ai-browser-agent.js
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default class AIBrowserAgent {
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
            content: `You are a web automation agent who uses puppeteer to control a headless browser. You can interact with the current webpage DOM. Suggest the best next action to achieve the user's instruction. 
                      Please break down complex tasks into smaller steps and use the tools provided to perform actions on the webpage.
                      For instance, if the user asks you to "search for MrBeast on YouTube and click his channel", you should: 
                      1. Navigate to YouTube
                      2. Type "MrBeast" in the search bar 
                      3. Click the search button
                      4. Click on the first channel result.
                      You can perform actions like clicking elements, typing text, or navigating to URLs.
                      Use the tools provided to perform these actions. If you need to type text, use the "type" action with the appropriate selector.
                      If you need to click an element, use the "click" action with the appropriate selector.
                      If you need to navigate to a URL, use the "navigate" action with the URL as the selector.
                      Always ensure the selector is valid and exists on the page before performing actions.`
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
      await this.page.goto(options.url, { waitUntil: "networkidle0", timeout: this.browserTimeout });
      if (this.verbose) console.log(`🌐 Navigated to: ${options.url}`);
    }

    const domContent = await this.page.content();

    this.memory.push({
      role: "user",
      content: `Instruction: ${userPrompt}\n\nDOM Snapshot:\n${domContent.slice(0, 8000)}...`
    });

    while (true) {
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

      const choice = response.choices[0];
      const toolCalls = choice.message.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        if (this.verbose) console.log("✅ No more actions to perform.");
        this.memory.push(choice.message);
        break;
      }

      this.memory.push({ role: "assistant", tool_calls: toolCalls });

      for (const toolCall of toolCalls) {
        const { id, function: fn } = toolCall;
        const { action: act, selector, text } = JSON.parse(fn.arguments);
        if (this.verbose) console.log("🤖 AI Action:", { act, selector, text });

        try {
          switch (act) {
            case "click":
              await this.page.waitForSelector(selector, { timeout: this.browserTimeout });
              await this.page.click(selector);
              break;
            case "type":
              await this.page.waitForSelector(selector, { timeout: this.browserTimeout });
              await this.page.type(selector, text || "");
              break;
            case "navigate":
              await this.page.goto(selector, { waitUntil: "networkidle0", timeout: this.browserTimeout });
              break;
            default:
              throw new Error(`Unsupported action: ${act}`);
          }

          if (this.verbose) console.log(`✅ Action performed: ${act} on ${selector}`);

          this.memory.push({
            role: "tool",
            tool_call_id: id,
            content: `✅ Action ${act} on ${selector} completed successfully.`
          });
        } catch (err) {
          console.error(`❌ Error performing action '${act}':`, err);
          this.memory.push({
            role: "tool",
            tool_call_id: id,
            content: `❌ Failed to perform action ${act} on ${selector}: ${err.message}`
          });
        }
      }
    }
  }
}
