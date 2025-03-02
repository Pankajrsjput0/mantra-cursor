import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GENRES, Novel } from '../types';
import { toast } from 'react-hot-toast';
import { uploadNovelCover } from '../lib/storage';

interface EditNovelModalProps {
  novel: Novel;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditNovelModal({ novel, isOpen, onClose, onUpdate }: EditNovelModalProps) {
  const [formData, setFormData] = useState({
    title: novel.title,
    author: novel.author,
    genre: novel.genre,
    leading_character: novel.leading_character,
    story: novel.story
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let coverImageUrl = novel.novel_coverpage;
      
      if (coverImage) {
        coverImageUrl = await uploadNovelCover(coverImage);
      }
      
      // Update novel data
      const { error: updateError } = await supabase
        .from('Novels')
        .update({
          ...formData,
          novel_coverpage: coverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('novel_id', novel.novel_id);

      if (updateError) throw updateError;

      toast.success('Novel updated successfully!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating novel:', error);
      setError(error.message || 'Failed to update novel');
      toast.error(error.message || 'Failed to update novel');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Novel</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <input
              id="cover-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type.startsWith('image/')) {
                    setCoverImage(file);
                  } else {
                    toast.error('Please select an image file');
                  }
                }
              }}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100"
            />
            {novel.novel_coverpage && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Current cover:</p>
                <img 
                  src={novel.novel_coverpage} 
                  alt="Current cover" 
                  className="mt-1 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              disabled={loading}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-orange-500 focus:ring-orange-500
                disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Author</label>
            <input
              type="text"
              required
              disabled={loading}
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-orange-500 focus:ring-orange-500
                disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genres (max 3)</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      genre: prev.genre.includes(genre)
                        ? prev.genre.filter(g => g !== genre)
                        : prev.genre.length < 3
                        ? [...prev.genre, genre]
                        : prev.genre
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors
                    ${formData.genre.includes(genre)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'}
                    disabled:opacity-50`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Leading Character</label>
            <select
              value={formData.leading_character}
              disabled={loading}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                leading_character: e.target.value as 'male' | 'female' 
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-orange-500 focus:ring-orange-500
                disabled:opacity-50"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Synopsis</label>
            <textarea
              required
              disabled={loading}
              value={formData.story}
              onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-orange-500 focus:ring-orange-500 h-32
                disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg 
                hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}