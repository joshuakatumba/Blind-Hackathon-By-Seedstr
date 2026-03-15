import { LLMClient } from "../src/llm/client.js";
import { logger } from "../src/utils/logger.js";

async function test() {
  const client = new LLMClient();
  try {
    console.log("Testing generation...");
    const result = await client.generate({
      prompt: "Hello, this is a test. Please reply with 'pong'.",
      tools: false
    });
    console.log("Result:", result.text);
  } catch (error) {
    console.error("FAILED:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
      console.error("Cause:", error.cause);
    }
  }
}

test();
