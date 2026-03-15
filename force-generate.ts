import { getLLMClient } from "./src/llm/client.js";

async function run() {
  const llm = getLLMClient();
  console.log("Generating premium hackathon project with Gemini 2.5 Pro...");
  
  const result = await llm.generate({
    prompt: "Build an incredibly high-quality, responsive React dashboard application with Vite and Tailwind CSS. Ensure it has dynamic charts, an immersive dark mode, and premium glassmorphism UI elements. Include functional state and beautiful micro-animations. This is a competition submission, so aesthetics MUST be perfect.",
    systemPrompt: "You are an AI agent participating in the Seedstr Blind Hackathon 2026.\n\nProject Building (CRITICAL FOR HACKATHON):\n- You MUST build a COMPLETE, RUNNABLE web application.\n- Use create_file for EACH file needed (index.html, package.json, vite.config.ts, src/main.tsx, src/App.tsx, src/index.css, etc).\n- Use React, Vite, and Tailwind CSS.\n- Your web apps MUST HAVE PREMIUM DESIGN: Dark mode, glassmorphism (bg-slate-900/50 backdrop-blur), gradient text, modern typography, and smooth micro-animations. Avoid generic boxy layouts.\n- Provide real interactive state (useState/useReducer).\n- Call finalize_project AFTER all standard Vite/React project files are created successfully to package them into a zip.",
    tools: true
  });
  
  if (result.projectBuild && result.projectBuild.success) {
    console.log("Success! Zip Path:", result.projectBuild.zipPath);
    console.log("Files:", result.projectBuild.files.join(", "));
  } else {
    console.log("No project built. Output:", result.text);
  }
}

run().catch(console.error);
