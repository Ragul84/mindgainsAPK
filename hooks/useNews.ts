import { useState, useEffect } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  author: string;
  publishedAt: string;
  imageUrl: string;
  readTime: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  examRelevance: number;
  tags: string[];
  keyPoints: string[];
  examQuestions: string[];
  sourceUrl: string;
}

interface TodaysHighlight {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium';
  examWeight: number;
  article?: NewsArticle;
}

export const useNews = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [todaysHighlights, setTodaysHighlights] = useState<TodaysHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchNews = async (category = 'all', refresh = false) => {
    try {
      // Avoid too frequent API calls (minimum 5 minutes between calls)
      const now = Date.now();
      if (!refresh && news.length > 0 && (now - lastFetchTime) < 5 * 60 * 1000) {
        console.log('📰 Using cached news data');
        return;
      }

      if (refresh) setLoading(true);
      
      console.log(`📰 Fetching fresh news for category: ${category}`);
      
      const response = await fetch(`/api/fetch-news?category=${category}&page=1`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch news');
      }

      console.log(`✅ Fetched ${data.articles.length} articles`);
      
      setNews(data.articles);
      setLastFetchTime(now);
      
      // Generate today's highlights from fetched articles
      generateTodaysHighlights(data.articles);
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching news:', err);
      setError(err.message);
      
      // Set fallback data if no cached data exists
      if (news.length === 0) {
        const fallbackNews: NewsArticle[] = [
          {
            id: 'fallback_1',
            title: 'Current Affairs Updates Available',
            summary: 'Stay updated with the latest news and current affairs for competitive exam preparation.',
            content: 'We are working to bring you the latest news updates. Please check back later.',
            category: 'general',
            source: 'MindGains AI',
            author: 'Editorial Team',
            publishedAt: new Date().toISOString(),
            imageUrl: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400',
            readTime: 2,
            importance: 'medium',
            examRelevance: 70,
            tags: ['Current Affairs', 'Updates'],
            keyPoints: ['Stay informed with latest developments', 'Regular updates for exam preparation'],
            examQuestions: ['What are the latest current affairs topics?'],
            sourceUrl: '#'
          }
        ];
        setNews(fallbackNews);
        generateTodaysHighlights(fallbackNews);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateTodaysHighlights = (articles: NewsArticle[]) => {
    // Filter and sort articles by importance and exam relevance
    const criticalArticles = articles
      .filter(article => article.importance === 'critical' || article.examRelevance >= 85)
      .sort((a, b) => b.examRelevance - a.examRelevance)
      .slice(0, 5);

    const highlights: TodaysHighlight[] = criticalArticles.map((article, index) => ({
      id: `highlight_${index}`,
      title: article.title,
      description: article.summary,
      importance: article.importance as 'critical' | 'high' | 'medium',
      examWeight: article.examRelevance,
      article: article
    }));

    // Add some default highlights if we don't have enough
    if (highlights.length < 3) {
      const defaultHighlights: TodaysHighlight[] = [
        {
          id: 'default_1',
          title: 'Government Policy Updates',
          description: 'Latest policy changes and government initiatives',
          importance: 'high',
          examWeight: 90
        },
        {
          id: 'default_2',
          title: 'International Relations',
          description: 'Key diplomatic developments and bilateral agreements',
          importance: 'high',
          examWeight: 85
        },
        {
          id: 'default_3',
          title: 'Economic Indicators',
          description: 'Important economic data and market developments',
          importance: 'medium',
          examWeight: 80
        }
      ];

      highlights.push(...defaultHighlights.slice(0, 3 - highlights.length));
    }

    setTodaysHighlights(highlights);
  };

  const searchNews = async (query: string): Promise<NewsArticle[]> => {
    try {
      // Search within existing news
      const filtered = news.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.summary.toLowerCase().includes(query.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return filtered;
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  };

  const getNewsByCategory = (category: string): NewsArticle[] => {
    if (category === 'all') return news;
    return news.filter(article => article.category === category);
  };

  const getNewsByImportance = (importance: string): NewsArticle[] => {
    return news.filter(article => article.importance === importance);
  };

  // Auto-fetch news on mount
  useEffect(() => {
    fetchNews();
  }, []);

  return {
    news,
    todaysHighlights,
    loading,
    error,
    fetchNews,
    searchNews,
    getNewsByCategory,
    getNewsByImportance,
    refreshNews: () => fetchNews('all', true),
    lastFetchTime
  };
};