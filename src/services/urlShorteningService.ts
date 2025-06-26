
// PHASE 3: Simple URL Shortening Service
// This creates readable short URLs without external dependencies

export interface ShortUrlData {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: Date;
  clickCount: number;
}

class UrlShorteningService {
  private static readonly BASE_URL = 'https://ayb.link';
  private static readonly STORAGE_KEY = 'ayb_short_urls';

  // Generate a readable short code
  private static generateShortCode(): string {
    const adjectives = ['quick', 'smart', 'bright', 'swift', 'clear', 'fast', 'easy', 'cool'];
    const nouns = ['link', 'path', 'way', 'route', 'door', 'key', 'code', 'gate'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    return `${adjective}-${noun}-${number}`;
  }

  // Get stored URLs from localStorage
  private static getStoredUrls(): Record<string, ShortUrlData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Save URLs to localStorage
  private static saveUrls(urls: Record<string, ShortUrlData>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(urls));
    } catch (error) {
      console.error('Failed to save URLs:', error);
    }
  }

  // Create a short URL
  static createShortUrl(originalUrl: string): ShortUrlData {
    const storedUrls = this.getStoredUrls();
    
    // Check if URL already exists
    const existingEntry = Object.values(storedUrls).find(
      entry => entry.originalUrl === originalUrl
    );
    
    if (existingEntry) {
      return existingEntry;
    }

    // Generate unique short code
    let shortCode: string;
    do {
      shortCode = this.generateShortCode();
    } while (storedUrls[shortCode]);

    const shortUrlData: ShortUrlData = {
      shortCode,
      shortUrl: `${this.BASE_URL}/${shortCode}`,
      originalUrl,
      createdAt: new Date(),
      clickCount: 0
    };

    // Save to storage
    storedUrls[shortCode] = shortUrlData;
    this.saveUrls(storedUrls);

    return shortUrlData;
  }

  // Get original URL from short code
  static getOriginalUrl(shortCode: string): string | null {
    const storedUrls = this.getStoredUrls();
    const urlData = storedUrls[shortCode];
    
    if (urlData) {
      // Increment click count
      urlData.clickCount++;
      this.saveUrls(storedUrls);
      return urlData.originalUrl;
    }
    
    return null;
  }

  // Get analytics for a short URL
  static getUrlAnalytics(shortCode: string): ShortUrlData | null {
    const storedUrls = this.getStoredUrls();
    return storedUrls[shortCode] || null;
  }

  // Get all stored URLs
  static getAllUrls(): ShortUrlData[] {
    const storedUrls = this.getStoredUrls();
    return Object.values(storedUrls);
  }
}

export default UrlShorteningService;
