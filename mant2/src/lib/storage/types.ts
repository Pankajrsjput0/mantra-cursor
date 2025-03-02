export interface StorageError extends Error {
  statusCode?: number;
  name: string;
  message: string;
}

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageResponse {
  publicUrl: string;
  error?: StorageError;
}

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}