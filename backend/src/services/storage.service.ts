import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  };
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export class StorageService {
  private isConfigured: boolean = false;

  constructor() {
    this.initializeCloudinary();
  }

  /**
   * Initialize Cloudinary configuration
   */
  private initializeCloudinary(): void {
    try {
      if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
          cloud_name: env.CLOUDINARY_CLOUD_NAME,
          api_key: env.CLOUDINARY_API_KEY,
          api_secret: env.CLOUDINARY_API_SECRET,
          secure: true,
        });
        this.isConfigured = true;
        console.log('✅ Cloudinary configured successfully');
      } else {
        console.warn('⚠️ Cloudinary not configured - file uploads will be disabled');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('❌ Failed to configure Cloudinary:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Upload file buffer to Cloudinary
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: {
            code: 'STORAGE_NOT_CONFIGURED',
            message: 'Storage service is not configured',
          },
        };
      }

      // Default options
      const uploadOptions: any = {
        resource_type: options.resourceType || 'auto',
        folder: options.folder || 'syncup',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      };

      // Add transformations if provided
      if (options.transformation) {
        uploadOptions.transformation = [];
        
        if (options.transformation.width || options.transformation.height) {
          uploadOptions.transformation.push({
            width: options.transformation.width,
            height: options.transformation.height,
            crop: options.transformation.crop || 'fill',
          });
        }

        if (options.transformation.quality) {
          uploadOptions.transformation.push({
            quality: options.transformation.quality,
          });
        }
      }

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(buffer);
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message || 'Failed to upload file',
        },
      };
    }
  }

  /**
   * Upload profile image with optimizations
   */
  async uploadProfileImage(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, `profile-${userId}`, {
      folder: 'syncup/profiles',
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto:good',
      },
      resourceType: 'image',
    });
  }

  /**
   * Upload post image with optimizations
   */
  async uploadPostImage(buffer: Buffer, postId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, `post-${postId}`, {
      folder: 'syncup/posts',
      transformation: {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
      },
      resourceType: 'image',
    });
  }

  /**
   * Upload company logo with optimizations
   */
  async uploadCompanyLogo(buffer: Buffer, companyId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, `company-${companyId}`, {
      folder: 'syncup/companies',
      transformation: {
        width: 300,
        height: 300,
        crop: 'fit',
        quality: 'auto:good',
      },
      resourceType: 'image',
    });
  }

  /**
   * Upload event banner with optimizations
   */
  async uploadEventBanner(buffer: Buffer, eventId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, `event-${eventId}`, {
      folder: 'syncup/events',
      transformation: {
        width: 1200,
        height: 600,
        crop: 'fill',
        quality: 'auto:good',
      },
      resourceType: 'image',
    });
  }

  /**
   * Upload document (PDF, DOC, etc.)
   */
  async uploadDocument(buffer: Buffer, filename: string, folder: string = 'documents'): Promise<UploadResult> {
    return this.uploadFile(buffer, filename, {
      folder: `syncup/${folder}`,
      resourceType: 'raw',
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
        };
      }

      const result = await cloudinary.uploader.destroy(publicId);
      
      return {
        success: result.result === 'ok',
        error: result.result !== 'ok' ? { code: 'DELETE_FAILED', message: 'Failed to delete file' } : undefined,
      };
    } catch (error: any) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      };
    }
  }

  /**
   * Generate signed URL for secure uploads (client-side)
   */
  async generateSignedUploadUrl(
    folder: string = 'syncup',
    transformation?: any
  ): Promise<{
    success: boolean;
    uploadUrl?: string;
    signature?: string;
    timestamp?: number;
    error?: any;
  }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
        };
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const params: any = {
        timestamp,
        folder,
      };

      if (transformation) {
        params.transformation = transformation;
      }

      const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);

      return {
        success: true,
        uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        signature,
        timestamp,
      };
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      return {
        success: false,
        error: { code: 'SIGNATURE_ERROR', message: error.message },
      };
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    } = {}
  ): string {
    if (!this.isConfigured) {
      return '';
    }

    return cloudinary.url(publicId, {
      ...options,
      secure: true,
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    success: boolean;
    stats?: {
      totalFiles: number;
      totalSize: number;
      bandwidth: number;
    };
    error?: any;
  }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
        };
      }

      // Note: This requires Cloudinary Admin API
      // For basic usage, we'll return a placeholder
      return {
        success: true,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          bandwidth: 0,
        },
      };
    } catch (error: any) {
      console.error('Error getting storage stats:', error);
      return {
        success: false,
        error: { code: 'STATS_ERROR', message: error.message },
      };
    }
  }

  /**
   * Check if storage service is configured and ready
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const storageService = new StorageService();