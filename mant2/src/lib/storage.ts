import { supabase } from './supabase';



async function validateFile(file: File) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.');
  }
}

export async function uploadNovelCover(file: File): Promise<string> {
  try {
    // Basic validation
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid file. Please upload an image.');
    }
    
    // Create a unique name based on timestamp and original filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `novel_cover_${timestamp}.${fileExt}`;
    
    // Use fetch directly to upload the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Get token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Upload using fetch API instead of Supabase client
    const response = await fetch(
      `${supabase.supabaseUrl}/storage/v1/object/novel_coverpage/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: file  // Direct file upload
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }
    
    // Generate public URL
    const { data } = supabase.storage
      .from('novel_coverpage')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function uploadProfilePicture(file: File): Promise<string> {
  try {
    // Basic validation
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid file. Please upload an image.');
    }
    
    // Create a unique name based on timestamp and original filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_${timestamp}.${fileExt}`;
    
    // Get token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Upload using fetch API instead of Supabase client
    const response = await fetch(
      `${supabase.supabaseUrl}/storage/v1/object/profile_pictures/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: file  // Direct file upload
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }
    
    // Generate public URL
    const { data } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}