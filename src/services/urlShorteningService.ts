
export class UrlShorteningService {
  private static readonly BASE_URL = 'https://ayat.ly'; // Custom short domain
  
  // Simple client-side URL shortening without database
  static createReadableShortUrl(originalUrl: string, studentName?: string): string {
    try {
      const url = new URL(originalUrl);
      const pathParts = url.pathname.split('/');
      const sessionId = pathParts[pathParts.length - 1];
      
      // Create a more readable short format
      const shortId = sessionId ? sessionId.substring(0, 8) : this.generateShortCode();
      const studentSuffix = studentName ? `-${studentName.toLowerCase().replace(/\s+/g, '')}` : '';
      
      return `ayat.ly/pay/${shortId}${studentSuffix}`;
    } catch (error) {
      console.warn('Failed to create readable short URL:', error);
      return originalUrl;
    }
  }

  // Generate a simple short code
  private static generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // For future database implementation - placeholder
  static async shortenUrl(originalUrl: string, customAlias?: string): Promise<string> {
    // For now, just return the readable short URL
    return this.createReadableShortUrl(originalUrl, customAlias);
  }
}
