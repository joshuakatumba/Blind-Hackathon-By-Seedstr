import prompts from "prompts";
async function test() {
  console.log("Prompts type:", typeof prompts);
  console.log("Prompts keys:", Object.keys(prompts));
  try {
    const response = await (prompts as any)({
      type: "text",
      name: "name",
      message: "What is your name?",
    });
    console.log("Response:", response);
  } catch (e) {
    console.error("Error calling prompts:", e);
  }
}
test();
