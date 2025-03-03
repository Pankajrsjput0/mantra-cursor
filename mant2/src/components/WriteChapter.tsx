import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { createChapter } from '../lib/api/chapters';
import { useAuth } from '../contexts/AuthContext';
import './WriteChapter.css'; // Make sure to create this CSS file if needed

// Define TypeScript interfaces for our data
interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface RouteParams {
  id: string;
}

const WriteChapter: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [showAddChapterModal, setShowAddChapterModal] = useState<boolean>(false);
  const [showAllChapters, setShowAllChapters] = useState<boolean>(false);

  const history = useHistory();
  const { id: novelId } = useParams<RouteParams>();
  const { userProfile } = useAuth();

  const fetchChapters = async () => {
    if (!novelId) {
      toast.error('Novel ID is missing');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });
        
      if (error) throw error;
      setChapters(data || []);
    } catch (error: any) {
      console.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novelId) {
      toast.error('Novel ID is missing');
      return;
    }

    if (!userProfile || !userProfile.user_id) {
      toast.error('You must be logged in to add chapters');
      return;
    }

    try {
      setIsLoading(true);
      
      const newChapter = {
        novel_id: novelId,
        title: newChapterTitle.trim(),
        content: '',
        chapter_number: chapters.length + 1,
        status: 'draft'
      };
      
      const result = await createChapter(newChapter, userProfile.user_id);
      
      if (result.error) throw new Error(result.error);
      
      // Get the newly created chapter data
      const { data: newChapterData, error: fetchError } = await supabase
        .from('Chapters')
        .select('*')
        .eq('novel_id', novelId)
        .eq('title', newChapterTitle.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Add the new chapter to the state without refetching all chapters
      setChapters(prevChapters => [...prevChapters, newChapterData]);
      
      // Reset form and close modal
      setNewChapterTitle('');
      setShowAddChapterModal(false);
      toast.success('Chapter created successfully!');
      
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      toast.error(error.message || 'Failed to create chapter');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to edit chapter
  const handleEditChapter = (chapterId: string) => {
    if (novelId) {
      history.push(`/novels/${novelId}/chapters/${chapterId}/edit`);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [novelId]);

  // Get the chapters to display based on the showAllChapters state
  const displayedChapters = showAllChapters 
    ? chapters 
    : chapters.slice(Math.max(0, chapters.length - 3));

  return (
    <div className="write-chapter-container">
      <h2>Chapters</h2>
      
      {isLoading && chapters.length === 0 ? (
        <div className="loading">Loading chapters...</div>
      ) : (
        <div className="chapters-list">
          {displayedChapters.length > 0 ? (
            displayedChapters.map(chapter => (
              <div key={chapter.id} className="chapter-item">
                <h3>{chapter.title}</h3>
                <p>Chapter {chapter.chapter_number}</p>
                <p>Status: {chapter.status}</p>
                <button 
                  onClick={() => handleEditChapter(chapter.id)}
                  className="edit-btn"
                >
                  Edit
                </button>
              </div>
            ))
          ) : (
            <p>No chapters found. Create your first chapter!</p>
          )}
          
          {/* Show "See All" button only if there are more than 3 chapters and not showing all */}
          {chapters.length > 3 && !showAllChapters && (
            <button 
              onClick={() => setShowAllChapters(true)}
              className="see-all-btn"
            >
              See all {chapters.length} chapters
            </button>
          )}
          
          {/* Show "Show Recent" button only if showing all chapters and there are more than 3 */}
          {showAllChapters && chapters.length > 3 && (
            <button 
              onClick={() => setShowAllChapters(false)}
              className="show-less-btn"
            >
              Show recent chapters
            </button>
          )}
        </div>
      )}
      
      {/* Add chapter button */}
      <button 
        onClick={() => setShowAddChapterModal(true)}
        className="add-chapter-btn"
        disabled={isLoading}
      >
        Add New Chapter
      </button>
      
      {/* Add chapter modal */}
      {showAddChapterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Chapter</h2>
              <form onSubmit={handleAddChapter}>
                <div className="form-group">
                  <label htmlFor="chapterTitle">Chapter Title</label>
                  <input
                    id="chapterTitle"
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={() => setShowAddChapterModal(false)}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || !newChapterTitle.trim()}
                    className="submit-btn"
                  >
                    {isLoading ? 'Creating...' : 'Create Chapter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteChapter; 