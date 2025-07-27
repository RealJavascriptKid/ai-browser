import AIBrowserAgent from "./ai-browser-agent.js";
import fs from "fs";

(async () => {
  async function readPromptFile() {
    try {
      const data = await fs.promises.readFile("userPrompt.txt", "utf-8");
      return data.trim();
    } catch (error) {
      console.error("Error reading userPrompt.txt:", error);
      return "";
    }
  }

  async function wait() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const agent = new AIBrowserAgent({ useComputerUseModel: false,headless: false, browserTimeout: 5000 });
  try {
    let prevPrompt = "";
    while (true) {
      

         try{

              const userPrompt = await readPromptFile();
              if (!userPrompt || userPrompt === prevPrompt) {
                console.log("No user prompt found, waiting...");
                await wait(1000); // Wait before checking again
                continue; // Skip to the next iteration
              }
              prevPrompt = userPrompt; // Update previous prompt
              
              const result = await agent.execute(userPrompt);
              if (!result.success) {
                console.log("❌ Error executing task:", result.message);
                continue; // Skip to the next iteration
              }

              console.log("AI Success Response:", result.message);

         }catch(error){
              console.error("AI Error:", error.message);

         }


    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await agent.close();
  }
})();
