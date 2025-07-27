import AIBrowserAgent from "./ai-browser-agent.js";

(async () => {
  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 60000 });
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
