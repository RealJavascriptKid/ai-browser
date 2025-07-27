import AIBrowserAgent from "./ai-browser-agent.js";


(async () => {
  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 5000 });
  try {
    let result = await agent.execute(`Go to localhost:3000 and find pages that has any form input fields. 
      Please return result in JSON format with the following structure: 
      { 
      'pageTitle': 'title', 
      'pageUrl': 'url', 
      'formFields': ['field1', 'field2'] 
      }
      `);
    if(!result.success) 
      throw result.message || "Failed to execute task";


    console.log("AI Response:", result);
    //await agent.execute("Click on the latest video");
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await agent.close();
  }
})();
