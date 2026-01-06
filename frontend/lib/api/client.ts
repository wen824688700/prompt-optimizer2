/**
 * API Client for Prompt Optimizer Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Framework {
  id: string;
  name: string;
  description: string;
  match_score: number;
  reasoning?: string;
}

export interface MatchFrameworksRequest {
  input: string;
  attachment?: string;
  user_type?: 'free' | 'pro';
  model?: string;
}

export interface MatchFrameworksResponse {
  frameworks: Framework[];
}

export interface GeneratePromptRequest {
  input: string;
  framework_id: string;
  clarification_answers: {
    goalClarity: string;
    targetAudience: string;
    contextCompleteness: string;
    formatRequirements: string;
    constraints: string;
  };
  attachment_content?: string;
  user_id?: string;
  account_type?: 'free' | 'pro';
  model?: string;
}

export interface GeneratePromptResponse {
  output: string;
  framework_used: string;
  version_id: string;
}

export interface Version {
  id: string;
  user_id: string;
  content: string;
  type: 'save' | 'optimize';
  created_at: string;
  formatted_title: string;
}

export interface SaveVersionRequest {
  user_id?: string;
  content: string;
  type: 'save' | 'optimize';
}

export interface QuotaResponse {
  used: number;
  total: number;
  reset_time: string;
  can_generate: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Match frameworks based on user input
   */
  async matchFrameworks(request: MatchFrameworksRequest): Promise<MatchFrameworksResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/frameworks/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generate optimized prompt
   */
  async generatePrompt(request: GeneratePromptRequest): Promise<GeneratePromptResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/prompts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user's version list
   */
  async getVersions(userId: string = 'test_user', limit: number = 10): Promise<Version[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/versions?user_id=${userId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Save a new version
   */
  async saveVersion(request: SaveVersionRequest): Promise<Version> {
    const response = await fetch(`${this.baseURL}/api/v1/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<Version> {
    const response = await fetch(`${this.baseURL}/api/v1/versions/${versionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Rollback to a specific version
   */
  async rollbackVersion(versionId: string, userId: string = 'test_user'): Promise<Version> {
    const response = await fetch(
      `${this.baseURL}/api/v1/versions/${versionId}/rollback?user_id=${userId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user quota information
   */
  async getQuota(userId: string = 'test_user', accountType: 'free' | 'pro' = 'free'): Promise<QuotaResponse> {
    // 获取用户时区偏移量（分钟）
    const timezoneOffset = -new Date().getTimezoneOffset();
    
    const response = await fetch(
      `${this.baseURL}/api/v1/quota?user_id=${userId}&account_type=${accountType}&timezone_offset=${timezoneOffset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient();
