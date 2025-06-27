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

      // Insert into database
      const { data, error } = await supabase
        .from('short_urls')
        .insert({
          short_code: shortCode,
          original_url: params.originalUrl,
          student_name: params.studentName,
          parent_name: params.parentName,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating short URL:', error);
        return { success: false, error: 'Failed to create short URL' };
      }

      const shortUrl = `${this.BASE_DOMAIN}/${shortCode}`;
      
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
      await supabase
        .from('short_urls')
        .update({
          click_count: supabase.sql`click_count + 1`,
          last_clicked_at: new Date().toISOString()
        })
        .eq('short_code', shortCode);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('short_urls')
        .select('original_url, expires_at')
        .eq('short_code', shortCode)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Track the click
      await this.trackClick(shortCode);

      return data.original_url;
    } catch (error) {
      console.error('Error getting original URL:', error);
      return null;
    }
  }

  static async getUrlAnalytics(shortCode: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('short_urls')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        shortCode: data.short_code,
        originalUrl: data.original_url,
        clickCount: data.click_count,
        createdAt: data.created_at,
        lastClickedAt: data.last_clicked_at,
        expiresAt: data.expires_at,
        studentName: data.student_name,
        parentName: data.parent_name
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
