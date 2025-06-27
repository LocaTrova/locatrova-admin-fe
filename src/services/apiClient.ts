import tokenService from './tokenService';

// Types and constants (KISS principle - clear and simple)
interface ApiClientOptions {
  requiresAuth?: boolean;
  customHeaders?: Record<string, string>;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class ApiClient {
  private readonly baseUrl: string;
  
  private static readonly DEFAULT_METHOD: HttpMethod = 'GET';
  private static readonly LOGIN_ENDPOINT = '/auth/login';
  private static readonly LOGOUT_ENDPOINT = '/auth/logout';
  private static readonly REFRESH_ENDPOINT = '/auth/refresh-token';
  private static readonly UNAUTHORIZED_STATUS = 401;
  private static readonly JSON_CONTENT_TYPE = 'application/json';

  constructor() {
    this.baseUrl = this.buildBaseUrl();
  }

  // Single Responsibility: Build base URL
  private buildBaseUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL as string;
    return `${apiUrl}/api`;
  }

  public async request(
    endpoint: string,
    method: HttpMethod = ApiClient.DEFAULT_METHOD,
    data?: unknown,
    options: ApiClientOptions = { requiresAuth: true }
  ): Promise<unknown> {
    const requestConfig = this.buildRequestConfig(method, data, options);
    const url = this.buildUrl(endpoint);
    
    const response = await fetch(url, requestConfig);
    
    if (this.shouldRetryWithRefresh(response, endpoint, options)) {
      return this.retryWithTokenRefresh(url, requestConfig);
    }

    return this.handleResponse(response);
  }

  // Single Responsibility: Build request configuration (DRY principle)
  private buildRequestConfig(method: HttpMethod, data: unknown, options: ApiClientOptions): RequestInit {
    const headers = this.buildHeaders(data, options);
    const body = this.buildBody(data);

    return { method, headers, body };
  }

  // Single Responsibility: Build headers
  private buildHeaders(data: unknown, options: ApiClientOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': ApiClient.JSON_CONTENT_TYPE,
      ...options.customHeaders,
    };

    // Remove Content-Type for FormData
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    // Add authorization header if required
    if (options.requiresAuth) {
      this.addAuthHeader(headers);
    }

    return headers;
  }

  // Single Responsibility: Add auth header
  private addAuthHeader(headers: Record<string, string>): void {
    const token = tokenService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Single Responsibility: Build request body (DRY principle)
  private buildBody(data: unknown): string | FormData | undefined {
    if (!data) return undefined;
    if (data instanceof FormData) return data;
    return JSON.stringify(data);
  }

  // Single Responsibility: Build URL
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  // Single Responsibility: Check if should retry with refresh
  private shouldRetryWithRefresh(response: Response, endpoint: string, options: ApiClientOptions): boolean {
    return response.status === ApiClient.UNAUTHORIZED_STATUS && 
           !endpoint.includes('/login') && 
           (options.requiresAuth ?? false);
  }

  // Single Responsibility: Retry request with token refresh
  private async retryWithTokenRefresh(url: string, config: RequestInit): Promise<unknown> {
    const refreshed = await this.refreshToken();
    
    if (!refreshed) {
      this.handleUnauthorized();
      throw new Error('Session expired');
    }

    // Update auth header with new token
    const headers = { ...config.headers } as Record<string, string>;
    this.addAuthHeader(headers);
    
    const retryResponse = await fetch(url, { ...config, headers });
    return this.handleResponse(retryResponse);
  }

  // Single Responsibility: Handle unauthorized access
  private handleUnauthorized(): void {
    tokenService.clearTokens();
    this.dispatchAuthEvent('unauthenticated');
  }

  // Single Responsibility: Handle API response
  private async handleResponse(response: Response): Promise<unknown> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  // Single Responsibility: Refresh authentication token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(this.buildUrl(ApiClient.REFRESH_ENDPOINT), {
        method: 'POST',
        headers: { 'Content-Type': ApiClient.JSON_CONTENT_TYPE },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return this.handleRefreshResponse(data);
    } catch {
      return false;
    }
  }

  // Single Responsibility: Handle refresh token response
  private handleRefreshResponse(data: unknown): boolean {
    const typedData = data as { success?: boolean; data?: { accessToken?: string } };
    if (typedData.success && typedData.data?.accessToken) {
      tokenService.setTokens({
        accessToken: typedData.data.accessToken,
        refreshToken: tokenService.getRefreshToken()!,
      });
      return true;
    }
    return false;
  }

  // Single Responsibility: Dispatch authentication events (DRY principle)
  private dispatchAuthEvent(event: 'login' | 'logout' | 'unauthenticated'): void {
    window.dispatchEvent(new CustomEvent('auth', { 
      detail: { event } 
    }));
  }

  // Authentication methods with single responsibilities
  async login(email: string, password: string): Promise<unknown> {
    const response = await this.request(
      ApiClient.LOGIN_ENDPOINT, 
      'POST', 
      { email, password },
      { requiresAuth: false }
    );
    
    this.handleLoginSuccess(response);
    return response;
  }

  async logout(): Promise<void> {
    await this.request(ApiClient.LOGOUT_ENDPOINT, 'POST');
    tokenService.clearTokens();
    this.dispatchAuthEvent('logout');
  }

  // Single Responsibility: Handle successful login
  private handleLoginSuccess(response: unknown): void {
    const typedResponse = response as { success?: boolean; data?: { tokens?: unknown } };
    if (typedResponse.success && typedResponse.data?.tokens) {
      tokenService.setTokens(typedResponse.data.tokens as { accessToken: string; refreshToken: string });
      this.dispatchAuthEvent('login');
    }
  }
}

export default new ApiClient(); 