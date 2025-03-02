import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Novel } from '../types';
import NovelCard from '../components/NovelCard';
import GenreCarousel from '../components/GenreCarousel';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNovels } from '../hooks/useNovels';

export default function Home() {
  const { userProfile } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useNovels({
    page,
    limit: 10,
    genre: selectedGenre,
    orderBy: 'views'
  });

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] rounded-xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d"
          alt="Library"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
          <div className="text-white ml-8 md:ml-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Stories</h1>
            <p className="text-lg md:text-xl mb-8">Explore thousands of web novels across multiple genres</p>
            <Link 
              to="/explore"
              className="inline-block bg-orange-500 text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors"
            >
              Start Reading
            </Link>
          </div>
        </div>
      </div>

      {/* Genre Carousel */}
      <div className="mb-12">
        <GenreCarousel
          selectedGenre={selectedGenre}
          onGenreSelect={handleGenreSelect}
        />
      </div>

      {/* Novels Grid */}
      <h2 className="text-2xl font-bold mb-8">
        {selectedGenre === 'All' ? 'Popular Novels' : `Top ${selectedGenre} Novels`}
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">{(error as Error)?.message || 'Failed to load novels'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      ) : data?.novels && data.novels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {data.novels.map((novel: Novel) => (
              <NovelCard key={novel.novel_id} novel={novel} />
            ))}
          </div>
          
          {data.hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
              >
                Load More
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No novels available in this genre yet.</p>
        </div>
      )}
    </div>
  );
}