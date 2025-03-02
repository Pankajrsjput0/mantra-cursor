import { toast } from 'react-hot-toast';

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  maxSizeMB: 2,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Validates a file against size and type constraints
 * @param file The file to validate
 * @param options Optional validation options
 */
export async function validateFile(file: File, options: FileValidationOptions = DEFAULT_OPTIONS) {
  const { maxSizeMB = 2, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.');
  }
}