/**
 * A service for managing JWT tokens in the frontend application
 */

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  exp: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class TokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Initialize tokens from localStorage if they exist
    this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store both access and refresh tokens
   */
  setTokens(tokens: Tokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    // Store tokens in localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  /**
   * Get the stored access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the stored refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired(this.accessToken);
  }

  /**
   * Get current user information from the token
   */
  getCurrentUser(): { userId: string; email: string; username: string; } | null {
    if (!this.accessToken) return null;

    try {
      const decoded = JSON.parse(atob(this.accessToken.split('.')[1])) as DecodedToken;
      return {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
      };
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1])) as DecodedToken;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export default new TokenService();