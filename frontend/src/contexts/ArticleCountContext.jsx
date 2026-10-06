import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

/**
 * ArticleCountContext
 * Provides global access to article count data (pending reviews, etc.)
 * Prevents redundant API calls across component navigation
 */
export const ArticleCountContext = createContext();

export function ArticleCountProvider({ children }) {
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [rejectedArticleCount, setRejectedArticleCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch pending review count and rejected articles once on mount
  const fetchCounts = async () => {
    try {
      // Only fetch if user is authenticated (token exists)
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setPendingReviewCount(0);
        setRejectedArticleCount(0);
        return;
      }

      setLoading(true);
      
      // Fetch pending review count
      const pendingResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=review&page=1&page_size=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setPendingReviewCount(pendingResponse.data?.count || 0);

      // Fetch rejected articles count
      const rejectedResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=rejected&page=1&page_size=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setRejectedArticleCount(rejectedResponse.data?.count || 0);
    } catch (err) {
      // Handle auth errors gracefully
      if (err.response?.status === 401) {
        setPendingReviewCount(0);
        setRejectedArticleCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and poll when tab is active (every 60s)
  useEffect(() => {
    fetchCounts();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCounts();
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchCounts();
      }
    }, 60000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ArticleCountContext.Provider value={{ pendingReviewCount, rejectedArticleCount, loading, refetch: fetchCounts }}>
      {children}
    </ArticleCountContext.Provider>
  );
}

export function useArticleCount() {
  const context = React.useContext(ArticleCountContext);
  if (!context) {
    throw new Error('useArticleCount must be used within ArticleCountProvider');
  }
  return context;
}
