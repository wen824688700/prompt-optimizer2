/**
 * API Client for Prompt Optimizer Backend
 */

const DEFAULT_DEV_API_BASE_URL = 'http://127.0.0.1:8000';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'development' ? DEFAULT_DEV_API_BASE_URL : '');

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

export interface FeatureOption {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  vote_count: number;
  is_voted: boolean;
  created_at: string;
}

export interface VoteRequest {
  option_ids: string[];
}

export interface FeedbackRequest {
  content: string;
}

type ErrorDetail = unknown;

function errorDetailToMessage(detail: ErrorDetail): string | null {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail && typeof (detail as any).message === 'string') {
    return (detail as any).message as string;
  }
  return null;
}

async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: ErrorDetail; message?: unknown };
    const messageFromDetail = errorDetailToMessage(data.detail);
    if (messageFromDetail) return messageFromDetail;
    if (typeof data.message === 'string') return data.message;
    return `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildUrl(path: string): string {
    // If baseURL is empty (common in production single-origin), fall back to relative URLs.
    if (!this.baseURL) return path;
    return `${this.baseURL}${path}`;
  }

  async matchFrameworks(request: MatchFrameworksRequest): Promise<MatchFrameworksResponse> {
    const response = await fetch(this.buildUrl('/api/v1/frameworks/match'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async generatePrompt(request: GeneratePromptRequest): Promise<GeneratePromptResponse> {
    const response = await fetch(this.buildUrl('/api/v1/prompts/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getVersions(userId: string = 'test_user', limit: number = 10): Promise<Version[]> {
    const response = await fetch(
      this.buildUrl(`/api/v1/versions?user_id=${encodeURIComponent(userId)}&limit=${limit}`),
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async saveVersion(request: SaveVersionRequest): Promise<Version> {
    const response = await fetch(this.buildUrl('/api/v1/versions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getVersion(versionId: string): Promise<Version> {
    const response = await fetch(this.buildUrl(`/api/v1/versions/${encodeURIComponent(versionId)}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async rollbackVersion(versionId: string, userId: string = 'test_user'): Promise<Version> {
    const response = await fetch(
      this.buildUrl(
        `/api/v1/versions/${encodeURIComponent(versionId)}/rollback?user_id=${encodeURIComponent(userId)}`
      ),
      { method: 'POST', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getQuota(userId: string = 'test_user', accountType: 'free' | 'pro' = 'free'): Promise<QuotaResponse> {
    const response = await fetch(
      this.buildUrl(`/api/v1/quota?user_id=${encodeURIComponent(userId)}&account_type=${accountType}`),
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getFeatureOptions(userId?: string): Promise<FeatureOption[]> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(this.buildUrl('/api/v1/feedback/options'), {
      method: 'GET',
      headers,
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async submitVote(userId: string, optionIds: string[]): Promise<{ success: boolean; message: string }> {
    const response = await fetch(this.buildUrl('/api/v1/feedback/vote'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ option_ids: optionIds }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async submitFeedback(userId: string, content: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(this.buildUrl('/api/v1/feedback/submit'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }
}

export const apiClient = new APIClient();

