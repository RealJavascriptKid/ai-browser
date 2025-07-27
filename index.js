//import AIBrowserAgent from "./ai-browser-agent.js";
import AIBrowserAgent from "./stagehand-agent.js"; // Updated to use Stagehand


(async () => {
  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 5000 });
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
