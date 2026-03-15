import express from "express";
import cors from "cors";
import { EventEmitter } from "events";
import { getConfig, getStoredAgent } from "../config/index.js";
import type { AgentEvent, Stats } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class ApiServer {
  private app = express();
  private clients: any[] = [];
  private eventEmitter: EventEmitter;
  private currentStats: any = {};

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventListeners();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Get agent status and stats
    this.app.get("/api/stats", (req, res) => {
      res.json(this.currentStats);
    });

    // Get agent config and profile
    this.app.get("/api/config", (req, res) => {
      const config = getConfig();
      const profile = getStoredAgent();
      res.json({ config, profile });
    });

    // SSE Endpoint for real-time events
    this.app.get("/api/events", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Add client
      const id = Date.now();
      const newClient = { id, res };
      this.clients.push(newClient);

      // Handle client disconnect
      req.on("close", () => {
        this.clients = this.clients.filter((c) => c.id !== id);
      });
    });
  }

  private setupEventListeners() {
    this.eventEmitter.on("event", (event: AgentEvent) => {
      // Forward to all SSE clients
      const data = `data: ${JSON.stringify(event)}\n\n`;
      this.clients.forEach((client) => client.res.write(data));

      // Keep track of latest stats (if provided in some event or we need to poll)
      // Actually, we'll likely call runner.getStats() in the route
    });
  }

  public setStats(stats: any) {
    this.currentStats = stats;
  }

  public start(port: number) {
    this.app.listen(port, () => {
      logger.info(`API Server running on http://localhost:${port}`);
    });
  }
}
