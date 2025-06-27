import { supabase } from '@/integrations/supabase/client';

interface CreateShortUrlParams {
  originalUrl: string;
  studentName?: string;
  parentName?: string;
  expiresInDays?: number;
}

interface ShortUrlResponse {
  success: boolean;
  shortUrl?: string;
  shortCode?: string;
  error?: string;
}

export class UrlShorteningService {
  private static readonly BASE_DOMAIN = 'https://ayatbian.link';
  
  static async createShortUrl(params: CreateShortUrlParams): Promise<ShortUrlResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      // Generate a readable short code with student/parent name
      const shortCode = this.generateReadableShortCode(params.studentName, params.parentName);
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays || 30));

      // For now, create a simple short code without database storage
      // This can be enhanced later when the database table is properly migrated
      const shortUrl = `${this.BASE_DOMAIN}/${shortCode}`;
      
      // Store in localStorage temporarily for demo purposes
      // This should be replaced with proper database storage
      const urlData = {
        shortCode,
        originalUrl: params.originalUrl,
        studentName: params.studentName,
        parentName: params.parentName,
        createdAt: new Date().toISOString(),
        expiresAt: params.expiresInDays 
          ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        clickCount: 0,
        created_by: user.id
      };
      
      localStorage.setItem(`short_url_${shortCode}`, JSON.stringify(urlData));
      
      return {
        success: true,
        shortUrl,
        shortCode
      };
    } catch (error) {
      console.error('URL shortening service error:', error);
      return { success: false, error: 'Service error' };
    }
  }

  static async trackClick(shortCode: string): Promise<void> {
    try {
      const stored = localStorage.getItem(`short_url_${shortCode}`);
      if (stored) {
        const data = JSON.parse(stored);
        data.clickCount = (data.clickCount || 0) + 1;
        data.lastClickedAt = new Date().toISOString();
        localStorage.setItem(`short_url_${shortCode}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(`short_url_${shortCode}`);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Check if expired
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        return null;
      }

      // Track the click
      await this.trackClick(shortCode);

      return data.originalUrl;
    } catch (error) {
      console.error('Error getting original URL:', error);
      return null;
    }
  }

  static async getUrlAnalytics(shortCode: string): Promise<any> {
    try {
      const stored = localStorage.getItem(`short_url_${shortCode}`);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      return {
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        clickCount: data.clickCount || 0,
        createdAt: data.createdAt,
        lastClickedAt: data.lastClickedAt,
        expiresAt: data.expiresAt,
        studentName: data.studentName,
        parentName: data.parentName
      };
    } catch (error) {
      console.error('Error getting URL analytics:', error);
      return null;
    }
  }

  private static generateReadableShortCode(studentName?: string, parentName?: string): string {
    const name = studentName || parentName || 'user';
    // Clean name: remove spaces, special chars, keep only letters and numbers
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const shortName = cleanName.substring(0, 8);
    
    // Generate random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `pay-${shortName}-${randomSuffix}`;
  }
}
