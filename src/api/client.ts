import { getConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { readFileSync, statSync } from "fs";
import { basename } from "path";
import type {
  AgentInfo,
  Job,
  JobsListResponse,
  RegisterResponse,
  SubmitResponseResult,
  SubmitResponseOptions,
  VerifyResponse,
  UpdateProfileResponse,
  ApiError,
  FileAttachment,
  FileUploadResult,
  AcceptJobResult,
  DeclineJobResult,
} from "../types/index.js";

/**
 * Seedstr API Client
 * Handles all communication with the Seedstr platform API
 */
export class SeedstrClient {
  private baseUrl: string;
  private baseUrlV2: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    const config = getConfig();
    this.apiKey = apiKey ?? config.seedstrApiKey ?? "";
    this.baseUrl = baseUrl ?? config.seedstrApiUrl;
    this.baseUrlV2 = config.seedstrApiUrlV2;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useV2 = true // Default to v2 as v1 is deprecated
  ): Promise<T> {
    const base = useV2 ? this.baseUrlV2 : this.baseUrl;
    const url = `${base}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...(options.headers as Record<string, string>),
    };

    logger.debug(`API Request: ${options.method || "GET"} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      let data: any;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }

      if (!response.ok) {
        const error = data as ApiError;
        const msg = error.message || responseText || `API request failed: ${response.status}`;
        logger.error(`API Error (${response.status}): ${msg}`);
        throw new Error(msg);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("fetch failed")) {
          logger.error(`Network Error: ${error.message}. Please check your connection to ${url}`);
        }
        throw error;
      }
      throw new Error(String(error));
    }
  }

  /**
   * Register a new agent with the Seedstr platform
   */
  async register(
    walletAddress: string,
    walletType: "ETH" | "SOL" = "ETH",
    ownerUrl?: string
  ): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/register", {
      method: "POST",
      body: JSON.stringify({ walletAddress, walletType, ownerUrl }),
    });
  }

  /**
   * Get current agent information
   */
  async getMe(): Promise<AgentInfo> {
    return this.request<AgentInfo>("/me");
  }

  /**
   * Update agent profile
   */
  async updateProfile(data: {
    name?: string;
    bio?: string;
    profilePicture?: string;
  }): Promise<UpdateProfileResponse> {
    return this.request<UpdateProfileResponse>("/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Trigger verification check
   */
  async verify(): Promise<VerifyResponse> {
    return this.request<VerifyResponse>("/verify", {
      method: "POST",
    });
  }

  /**
   * List available jobs (v1)
   */
  async listJobs(limit = 20, offset = 0): Promise<JobsListResponse> {
    return this.request<JobsListResponse>(`/jobs?limit=${limit}&offset=${offset}`);
  }

  /**
   * List available jobs via v2 API (skill-matched, includes swarm jobs)
   */
  async listJobsV2(limit = 20, offset = 0): Promise<JobsListResponse> {
    return this.request<JobsListResponse>(`/jobs?limit=${limit}&offset=${offset}`, {}, true);
  }

  /**
   * Get a specific job by ID (v2 — includes acceptance and swarm info)
   */
  async getJobV2(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`, {}, true);
  }

  /**
   * Get a specific job by ID (v1)
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`);
  }

  /**
   * Accept a SWARM job (v2) — first-come-first-served
   */
  async acceptJob(jobId: string): Promise<AcceptJobResult> {
    return this.request<AcceptJobResult>(`/jobs/${jobId}/accept`, {
      method: "POST",
    }, true);
  }

  /**
   * Decline a job (v2) — optional, for analytics
   */
  async declineJob(jobId: string, reason?: string): Promise<DeclineJobResult> {
    return this.request<DeclineJobResult>(`/jobs/${jobId}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }, true);
  }

  /**
   * Update agent skills via v1 /me endpoint
   */
  async updateSkills(skills: string[]): Promise<UpdateProfileResponse> {
    return this.request<UpdateProfileResponse>("/me", {
      method: "PATCH",
      body: JSON.stringify({ skills }),
    });
  }

  /**
   * Submit a response to a job (text-only, for backward compatibility)
   */
  async submitResponse(
    jobId: string,
    content: string
  ): Promise<SubmitResponseResult> {
    return this.request<SubmitResponseResult>(`/jobs/${jobId}/respond`, {
      method: "POST",
      body: JSON.stringify({ content, responseType: "TEXT" }),
    });
  }

  /**
   * Submit a response via v2 API (supports auto-pay for SWARM jobs)
   */
  async submitResponseV2(
    jobId: string,
    content: string,
    responseType: "TEXT" | "FILE" = "TEXT",
    files?: FileAttachment[]
  ): Promise<SubmitResponseResult> {
    const body: Record<string, unknown> = { content, responseType };
    if (files && files.length > 0) body.files = files;
    return this.request<SubmitResponseResult>(`/jobs/${jobId}/respond`, {
      method: "POST",
      body: JSON.stringify(body),
    }, true);
  }

  /**
   * Submit a response with optional file attachments (v1)
   */
  async submitResponseWithFiles(
    jobId: string,
    options: SubmitResponseOptions
  ): Promise<SubmitResponseResult> {
    const body: Record<string, unknown> = {
      content: options.content,
      responseType: options.responseType || "TEXT",
    };

    if (options.files && options.files.length > 0) {
      body.files = options.files;
    }

    return this.request<SubmitResponseResult>(`/jobs/${jobId}/respond`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Upload a file to the Seedstr file upload service
   * Returns the file URL and metadata for use in responses
   */
  async uploadFile(filePath: string, retries = 3): Promise<FileAttachment> {
    const config = getConfig();
    
    // Get file info
    if (!statSync(filePath).isFile()) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = statSync(filePath);
    const fileName = basename(filePath);
    
    // Determine MIME type based on extension
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      zip: "application/zip",
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      json: "application/json",
      html: "text/html",
      css: "text/css",
      js: "text/javascript",
      ts: "text/typescript",
      md: "text/markdown",
      txt: "text/plain",
      tar: "application/x-tar",
      gz: "application/gzip",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    logger.debug(`Uploading file: ${fileName} (${stats.size} bytes, ${mimeType})`);

    // Read file and convert to base64
    const fileBuffer = readFileSync(filePath);
    const base64Content = fileBuffer.toString("base64");

    // Upload to the v1/upload endpoint (server-side upload API)
    const uploadUrl = `${config.seedstrApiUrl}/upload`;
    
    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: [
              {
                name: fileName,
                content: base64Content,
                type: mimeType,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { message: errorText };
          }
          throw new Error(`Upload failed: ${response.status} - ${errorData.message || errorText}`);
        }

        const result = (await response.json()) as { 
          success: boolean; 
          files: FileUploadResult[]; 
          failed?: { name: string; error: string }[] 
        };
        
        if (!result.success || !result.files || result.files.length === 0) {
          const failMsg = result.failed?.[0]?.error || "No files returned";
          throw new Error(`Upload failed: ${failMsg}`);
        }
        
        const fileResult = result.files[0];
        logger.debug(`File uploaded successfully: ${fileResult.url}`);

        return {
          url: fileResult.url,
          name: fileResult.name,
          size: fileResult.size,
          type: fileResult.type,
        };
      } catch (error) {
        lastError = error;
        logger.warn(`Upload attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to upload ${fileName} after ${retries} attempts`);
  }

  /**
   * Upload multiple files and return their attachments
   */
  async uploadFiles(filePaths: string[]): Promise<FileAttachment[]> {
    const attachments: FileAttachment[] = [];
    
    for (const filePath of filePaths) {
      const attachment = await this.uploadFile(filePath);
      attachments.push(attachment);
    }
    
    return attachments;
  }

  /**
   * Set the API key (for use after registration)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if client has an API key configured
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

// Export a default client instance
export const seedstrClient = new SeedstrClient();

export default SeedstrClient;
