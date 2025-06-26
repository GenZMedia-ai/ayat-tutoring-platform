
import { supabase } from '@/integrations/supabase/client';

export class UrlShorteningService {
  private static readonly BASE_URL = 'https://ayat.ly'; // Custom short domain
  
  static async shortenUrl(originalUrl: string, customAlias?: string): Promise<string> {
    try {
      console.log('🔗 Shortening URL:', originalUrl);
      
      // Generate a random short code if no custom alias provided
      const shortCode = customAlias || this.generateShortCode();
      
      // For now, we'll create a simple mapping in the database
      // In production, you might want to use a dedicated URL shortening service
      const { data, error } = await supabase
        .from('url_mappings')
        .insert({
          short_code: shortCode,
          original_url: originalUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Failed to create URL mapping, returning original URL:', error.message);
        return originalUrl;
      }

      const shortUrl = `${this.BASE_URL}/${shortCode}`;
      console.log('✅ URL shortened successfully:', { originalUrl, shortUrl });
      
      return shortUrl;
    } catch (error) {
      console.warn('⚠️ URL shortening failed, returning original URL:', error);
      return originalUrl;
    }
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('url_mappings')
        .select('original_url')
        .eq('short_code', shortCode)
        .single();

      if (error || !data) {
        return null;
      }

      // Track click
      await this.trackClick(shortCode);
      
      return data.original_url;
    } catch (error) {
      console.error('Error retrieving original URL:', error);
      return null;
    }
  }

  private static async trackClick(shortCode: string): Promise<void> {
    try {
      await supabase
        .from('url_clicks')
        .insert({
          short_code: shortCode,
          clicked_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to track click:', error);
    }
  }

  private static generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Fallback method for immediate use without database setup
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
}
