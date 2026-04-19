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
      setLoading(true);
      // Fetch pending review count
      const pendingResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=review&page=1&page_size=1`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setPendingReviewCount(pendingResponse.data.count || 0);
      console.log('[ArticleCountContext] Pending count fetched:', pendingResponse.data.count);

      // Fetch rejected articles count
      const rejectedResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/internal/articles/?status=rejected&page=1&page_size=1`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      setRejectedArticleCount(rejectedResponse.data.count || 0);
      console.log('[ArticleCountContext] Rejected count fetched:', rejectedResponse.data.count);
    } catch (err) {
      console.debug('[ArticleCountContext] Failed to fetch counts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up polling every 30 seconds
  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
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
