import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Novel, Chapter } from '../types';
import { BookOpen, Heart, Share2, Eye, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { addToLibrary, removeFromLibrary } from '../lib/api/library';
import { withTimeout, SUPABASE_TIMEOUT } from '../lib/utils';

export default function NovelDetail() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  useEffect(() => {
    const fetchNovel = async () => {
      if (!id) return;

      try {
        // Fetch novel details
        const { data: novelData, error: novelError } = await supabase
          .from('Novels')
          .select('*')
          .eq('novel_id', id)
          .single();

        if (novelError) throw novelError;
        setNovel(novelData);

        // Increment view count using RPC function
        try {
          await withTimeout(
            supabase.rpc('increment_novel_views', { novel_uuid: id }),
            SUPABASE_TIMEOUT,
            'Incrementing novel views'
          );
        } catch (error) {
          console.error('Error incrementing novel views:', error);
          // Don't throw here, we still want to show the novel
        }

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('Chapters')
          .select('*')
          .eq('novel_id', id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;
        setChapters(chaptersData || []);

        // Check if novel is in user's library
        if (userProfile) {
          const { data: libraryData, error: libraryError } = await supabase
            .from('Library')
            .select('library_id')
            .eq('user_id', userProfile.user_id)
            .eq('novel_id', id)
            .maybeSingle();

          if (!libraryError) {
            setIsInLibrary(!!libraryData);
          }
        }
      } catch (error) {
        console.error('Error fetching novel:', error);
        toast.error('Failed to load novel details');
      } finally {
        setLoading(false);
      }
    };

    fetchNovel();
  }, [id, userProfile]);

  const handleLibraryToggle = async () => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    if (!novel) return;

    setSavingToLibrary(true);
    try {
      if (isInLibrary) {
        const { success, error } = await removeFromLibrary(userProfile.user_id, novel.novel_id);
        if (!success) throw new Error(error);
        setIsInLibrary(false);
      } else {
        const { success, error } = await addToLibrary(userProfile.user_id, novel.novel_id);
        if (!success) throw new Error(error);
        setIsInLibrary(true);
      }
    } catch (error: any) {
      console.error('Error toggling library status:', error);
      toast.error(error.message || 'Failed to update library');
    } finally {
      setSavingToLibrary(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: novel?.title || 'Check out this novel',
        text: `Check out ${novel?.title} by ${novel?.author}`,
        url: window.location.href,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Novel not found</h1>
        <p className="mb-4">The novel you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Novel Cover and Info */}
        <div className="md:w-1/3 lg:w-1/4">
          <div className="sticky top-24">
            {novel.novel_coverpage ? (
              <img
                src={novel.novel_coverpage}
                alt={novel.title}
                className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg mb-4"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-lg mb-4 p-4 flex flex-col justify-center items-center text-white">
                <h3 className="text-xl font-bold text-center mb-2">{novel.title}</h3>
                <p className="text-sm opacity-90">by {novel.author}</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{novel.views}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLibraryToggle}
                  disabled={savingToLibrary}
                  className={`p-2 rounded-full ${
                    isInLibrary
                      ? 'bg-orange-100 text-orange-500'
                      : 'bg-gray-100 text-gray-500'
                  } hover:bg-orange-200 transition-colors`}
                  aria-label={isInLibrary ? 'Remove from library' : 'Add to library'}
                >
                  <Heart className={`h-5 w-5 ${isInLibrary ? 'fill-orange-500' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  aria-label="Share novel"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-1">{novel.title}</h2>
              <p className="text-gray-600 mb-2">by {novel.author}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {novel.genre.map(g => (
                  <span key={g} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {userProfile && novel.upload_by === userProfile.user_id && (
              <Link
                to="/write"
                className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 mb-4"
              >
                <Edit className="h-5 w-5" />
                Edit Novel
              </Link>
            )}

            {chapters.length > 0 && (
              <Link
                to={`/novel/${novel.novel_id}/chapter/${chapters[0].chapter_id}`}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600"
              >
                <BookOpen className="h-5 w-5" />
                Start Reading
              </Link>
            )}
          </div>
        </div>

        {/* Synopsis and Chapters */}
        <div className="md:w-2/3 lg:w-3/4">
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold mb-4">Synopsis</h3>
            <p className="text-gray-700 whitespace-pre-line">{novel.story}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Chapters</h3>
            {chapters.length > 0 ? (
              <div className="space-y-2">
                {chapters.map(chapter => (
                  <Link
                    key={chapter.chapter_id}
                    to={`/novel/${novel.novel_id}/chapter/${chapter.chapter_id}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <span className="font-medium">Chapter {chapter.chapter_number}:</span>
                      <span className="ml-2">{chapter.title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{chapter.views || 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No chapters available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}