import { getConfig, validateConfig } from "../src/config/index.js";
const config = getConfig();
console.log("Config loaded:");
console.log("OpenRouter API Key present:", !!config.openrouterApiKey);
console.log("Wallet Address:", config.walletAddress);
console.log("Errors:", validateConfig(config));
