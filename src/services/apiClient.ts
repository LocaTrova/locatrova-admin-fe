import tokenService from './tokenService';

interface ApiClientOptions {
  requiresAuth?: boolean;
  customHeaders?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL;
    this.baseUrl = `${apiUrl}api`;
  }

  public async request(
    endpoint: string,
    method: string = 'GET',
    data?: unknown,
    options: ApiClientOptions = { requiresAuth: true }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.customHeaders,
    };

    // Handle FormData differently
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    if (options.requiresAuth) {
      const token = tokenService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    // Skip token refresh for login endpoint
    if (response.status === 401 && !endpoint.includes('/login')) {
      if (options.requiresAuth) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${tokenService.getAccessToken()}`;
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...config,
            headers,
          });
          return this.handleResponse(retryResponse);
        }
      }
      
      tokenService.clearTokens();
      window.dispatchEvent(new CustomEvent('auth', { 
        detail: { event: 'unauthenticated' } 
      }));
      throw new Error('Session expired');
    }

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data.accessToken) {
        tokenService.setTokens({
          accessToken: data.data.accessToken,
          refreshToken: tokenService.getRefreshToken()!, // Keep existing refresh token
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', 'POST', 
      { email, password },
      { requiresAuth: false }
    );
    
    if (response.success && response.data.tokens) {
      tokenService.setTokens(response.data.tokens);
      window.dispatchEvent(new CustomEvent('auth', { 
        detail: { event: 'login' } 
      }));
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', 'POST');
    tokenService.clearTokens();
    window.dispatchEvent(new CustomEvent('auth', { 
      detail: { event: 'logout' } 
    }));
  }
}

export default new ApiClient(); 