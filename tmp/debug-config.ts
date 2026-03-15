import { getConfig, getStoredAgent } from "../src/config/index.js";

const config = getConfig();
const agent = getStoredAgent();

console.log("--- CONFIG ---");
console.log(JSON.stringify(config, null, 2));
console.log("--- STORED AGENT ---");
console.log(JSON.stringify(agent, null, 2));
