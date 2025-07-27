import AIBrowserAgent from "./ai-browser-agent.js";
import fs from "fs";


(async () => {

  let userPrompt;
  try {
    userPrompt = await fs.promises.readFile("userPrompt.txt", "utf-8");
  } catch {
    userPrompt = "";
  }

  if(!userPrompt || userPrompt.trim() === "") {
    userPrompt = "Search for the latest video on YouTube about AI and click on it.";
  }

  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 5000 });
  try {
    let result = await agent.execute(userPrompt);
    if(!result.success) 
      throw result.message || "Failed to execute task";


    console.log("AI Response:", result.message);
    //await agent.execute("Click on the latest video");
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await agent.close();
  }
})();
