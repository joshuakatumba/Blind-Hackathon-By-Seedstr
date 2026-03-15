import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(".env") });

async function test() {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  try {
    console.log("Testing raw AI SDK with google/gemini-flash-1.5...");
    const { text } = await generateText({
      model: openrouter("google/gemini-flash-1.5"),
      prompt: "Reply with 'pong'",
    });
    console.log("Success! Result:", text);
  } catch (error) {
    console.error("RAW SDK FAILED:", error);
  }
}

test();
