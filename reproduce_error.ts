import prompts from "prompts";

async function main() {
  const response = await prompts({
    type: "text",
    name: "value",
    message: "Test?",
  });
  console.log(response);
}

main();
