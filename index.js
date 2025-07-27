import AIBrowserAgent from "./ai-browser-agent.js";


(async () => {
  const agent = new AIBrowserAgent({ headless: false, browserTimeout: 5000 });
  try {
    let result = await agent.execute(`Go to localhost:3000 and find pages that has any form input fields. 
      Please return result in JSON format with the following structure: 
      { 
      'pageTitle': 'title', 
      'pageUrl': 'url', 
       'forms':[{
          'formTitle': 'title', 
          'formUrl': 'url', 
          'formDescription': 'description', 
          'formAction': 'actionUrl', 
          'formMethod': 'GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD|TRACE',
          'formInputs': [{
            inputName: 'name',
            inputType: 'text|email|password|checkbox|radio|select',
            inputPlaceholder: 'placeholder',
            inputValue: 'value'
          }],
        ... 
       ]
      }
      `);
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
