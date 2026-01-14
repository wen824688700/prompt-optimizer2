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
  timezone_offset?: number;
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
  version_number: string;
  description?: string;
  topic?: string;
  framework_id?: string;
  framework_name?: string;
  original_input?: string;
}

export interface SaveVersionRequest {
  user_id?: string;
  content: string;
  type: 'save' | 'optimize';
  version_number: string;
  description?: string;
  topic?: string;
  framework_id?: string;
  framework_name?: string;
  original_input?: string;
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

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  email_confirmed: boolean;
  accountType: 'free' | 'pro';
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  message: string;
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
    // 自动添加时区偏移量
    const timezoneOffset = -new Date().getTimezoneOffset();
    const requestWithTimezone = {
      ...request,
      timezone_offset: request.timezone_offset ?? timezoneOffset,
    };
    
    const response = await fetch(this.buildUrl('/api/v1/prompts/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithTimezone),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getVersions(userId: string = 'test_user', limit: number = 20): Promise<Version[]> {
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

  async deleteVersion(versionId: string, userId: string = 'test_user'): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      this.buildUrl(`/api/v1/versions/${encodeURIComponent(versionId)}?user_id=${encodeURIComponent(userId)}`),
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async getQuota(userId: string = 'test_user', accountType: 'free' | 'pro' = 'free'): Promise<QuotaResponse> {
    // 获取用户时区偏移量（分钟）
    const timezoneOffset = -new Date().getTimezoneOffset(); // 注意：getTimezoneOffset() 返回的是负值
    
    const response = await fetch(
      this.buildUrl(`/api/v1/quota?user_id=${encodeURIComponent(userId)}&account_type=${accountType}&timezone_offset=${timezoneOffset}`),
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

  // 邮箱认证相关方法
  async sendVerificationCode(email: string): Promise<SendCodeResponse> {
    const response = await fetch(this.buildUrl('/api/v1/auth/email/send-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async verifyCodeAndRegister(
    email: string,
    code: string,
    username: string,
    password: string
  ): Promise<VerifyCodeResponse> {
    const response = await fetch(this.buildUrl('/api/v1/auth/email/verify-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, username, password }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await fetch(this.buildUrl('/api/v1/auth/email/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ResetPasswordResponse> {
    const response = await fetch(this.buildUrl('/api/v1/auth/email/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }

  async checkUsernameAvailability(username: string): Promise<CheckUsernameResponse> {
    const response = await fetch(this.buildUrl('/api/v1/auth/email/check-username'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) throw new Error(await getResponseErrorMessage(response));
    return response.json();
  }
}

export const apiClient = new APIClient();

