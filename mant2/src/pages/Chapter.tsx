import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Chapter as ChapterType, Novel } from '../types';
import { ChevronLeft, ChevronRight, Edit, Eye, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateReadingProgress } from '../lib/api/reading-progress';
import { withTimeout, SUPABASE_TIMEOUT } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Chapter() {
  const { novelId, chapterId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterType | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || viewCounted) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= 0.8) {
        setHasReachedBottom(true);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [viewCounted]);

  useEffect(() => {
    if (hasReachedBottom && !viewCounted && chapterId) {
      const incrementViews = async () => {
        try {
          await withTimeout(
            supabase.rpc('increment_chapter_views', { chapter_uuid: chapterId }),
            SUPABASE_TIMEOUT,
            'Incrementing chapter views'
          );
          setViewCounted(true);
        } catch (error) {
          console.error('Error incrementing views:', error);
        }
      };

      incrementViews();
    }
  }, [hasReachedBottom, viewCounted, chapterId]);

  useEffect(() => {
    const fetchChapterData = async () => {
      if (!novelId || !chapterId) return;

      try {
        setLoading(true);
        
        // Fetch chapter
        const { data: chapterData, error: chapterError } = await supabase
          .from('Chapters')
          .select('*')
          .eq('chapter_id', chapterId)
          .single();

        if (chapterError) throw chapterError;
        setChapter(chapterData);

        // Fetch novel
        const { data: novelData, error: novelError } = await supabase
          .from('Novels')
          .select('*')
          .eq('novel_id', novelId)
          .single();

        if (novelError) throw novelError;
        setNovel(novelData);

        // Fetch all chapters to determine next/prev
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('Chapters')
          .select('chapter_id, chapter_number')
          .eq('novel_id', novelId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;

        const currentIndex = chaptersData.findIndex(c => c.chapter_id === chapterId);
        if (currentIndex > 0) {
          setPrevChapter(chaptersData[currentIndex - 1].chapter_id);
        } else {
          setPrevChapter(null);
        }

        if (currentIndex < chaptersData.length - 1) {
          setNextChapter(chaptersData[currentIndex + 1].chapter_id);
        } else {
          setNextChapter(null);
        }

        // Update reading progress if user is logged in
        if (userProfile) {
          await updateReadingProgress(userProfile.user_id, novelId, chapterId);
        }
      } catch (error) {
        console.error('Error fetching chapter data:', error);
        toast.error('Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [novelId, chapterId, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
        <p className="mb-4">The chapter you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <Link to={`/novel/${novelId}`} className="text-orange-500 hover:text-orange-600 flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Back to {novel.title}
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">Chapter {chapter.chapter_number}</p>
          <div className="flex items-center gap-1 text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{chapter.views || 0}</span>
          </div>
        </div>

        <div 
          ref={contentRef} 
          className="prose max-w-none mb-8 overflow-y-auto max-h-[70vh] p-4 bg-gray-50 rounded-lg"
        >
          <div className="whitespace-pre-line">{chapter.content}</div>
        </div>

        <div className="flex justify-between mt-8">
          {prevChapter ? (
            <button
              onClick={() => navigate(`/novel/${novelId}/chapter/${prevChapter}`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous Chapter
            </button>
          ) : (
            <div></div>
          )}

          {nextChapter ? (
            <button
              onClick={() => navigate(`/novel/${novelId}/chapter/${nextChapter}`)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Next Chapter
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <div></div>
          )}
        </div>

        {userProfile && novel.upload_by === userProfile.user_id && (
          <div className="mt-8 pt-8 border-t">
            <Link
              to="/write"
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
            >
              <Edit className="h-5 w-5" />
              Edit Chapter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}