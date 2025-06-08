export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'general';
    const page = url.searchParams.get('page') || '1';
    
    // Use the NewsAPI key you provided
    const NEWS_API_KEY = '03ae073106f949489966d5c30ef16481';
    
    if (!NEWS_API_KEY) {
      return Response.json(
        { success: false, error: 'News API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🗞️ Fetching news for category: ${category}, page: ${page}`);

    // Map our categories to NewsAPI categories
    const categoryMap: { [key: string]: string } = {
      'all': 'general',
      'politics': 'general',
      'economy': 'business',
      'international': 'general',
      'science': 'science',
      'environment': 'science',
      'sports': 'sports',
      'technology': 'technology',
      'health': 'health'
    };

    const apiCategory = categoryMap[category] || 'general';

    // Fetch from NewsAPI with India-specific parameters
    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=in&category=${apiCategory}&page=${page}&pageSize=20&apiKey=${NEWS_API_KEY}`,
      {
        headers: {
          'User-Agent': 'MindGains-AI/1.0'
        }
      }
    );

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('❌ NewsAPI error:', newsResponse.status, errorText);
      throw new Error(`NewsAPI returned ${newsResponse.status}: ${errorText}`);
    }

    const newsData = await newsResponse.json();
    console.log(`✅ NewsAPI response status: ${newsData.status}, articles: ${newsData.articles?.length || 0}`);

    if (newsData.status !== 'ok') {
      throw new Error(newsData.message || 'NewsAPI returned error status');
    }

    // Process and enhance articles for Indian exam context
    const processedArticles = newsData.articles
      .filter((article: any) => 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        !article.title.includes('[Removed]')
      )
      .map((article: any, index: number) => {
        // Calculate exam relevance score
        const examRelevance = calculateExamRelevance(article.title, article.description);
        
        // Determine importance level
        const importance = determineImportance(article.title, article.description);
        
        // Extract key points
        const keyPoints = extractKeyPoints(article.description || article.content);
        
        // Generate exam questions
        const examQuestions = generateExamQuestions(article.title, article.description);
        
        return {
          id: generateArticleId(article.url || `article_${index}_${Date.now()}`),
          title: article.title,
          summary: article.description || '',
          content: article.content || article.description || '',
          category: mapToOurCategory(article.title, article.description, category),
          source: article.source?.name || 'Unknown Source',
          author: article.author || 'Staff Reporter',
          publishedAt: article.publishedAt,
          imageUrl: article.urlToImage || `https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400`,
          readTime: calculateReadTime(article.content || article.description || ''),
          importance,
          examRelevance,
          tags: extractTags(article.title, article.description),
          keyPoints,
          examQuestions,
          sourceUrl: article.url
        };
      });

    console.log(`✅ Processed ${processedArticles.length} articles successfully`);

    return Response.json({
      success: true,
      articles: processedArticles,
      totalResults: newsData.totalResults,
      page: parseInt(page),
      category: category,
      apiStatus: newsData.status
    });

  } catch (error: any) {
    console.error('❌ News fetch error:', error);
    
    // Return mock data if API fails
    const mockArticles = [
      {
        id: 'mock_1',
        title: 'Government Announces New Education Policy Reforms',
        summary: 'The government has announced significant reforms to the education policy focusing on digital learning and skill development.',
        content: 'The Ministry of Education has unveiled comprehensive reforms aimed at modernizing the education system...',
        category: 'politics',
        source: 'Government Press Release',
        author: 'Education Ministry',
        publishedAt: new Date().toISOString(),
        imageUrl: 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=400',
        readTime: 5,
        importance: 'high' as const,
        examRelevance: 85,
        tags: ['Education', 'Policy', 'Government'],
        keyPoints: [
          'Focus on digital learning infrastructure',
          'Emphasis on skill-based education',
          'Integration of technology in classrooms',
          'Teacher training programs'
        ],
        examQuestions: [
          'What are the key features of the new education policy?',
          'How does this policy impact competitive exam preparation?'
        ],
        sourceUrl: '#'
      },
      {
        id: 'mock_2',
        title: 'Economic Survey Highlights GDP Growth Projections',
        summary: 'The latest economic survey projects steady GDP growth with focus on manufacturing and services sectors.',
        content: 'According to the economic survey, India is expected to maintain robust growth...',
        category: 'economy',
        source: 'Economic Times',
        author: 'Economics Desk',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400',
        readTime: 7,
        importance: 'high' as const,
        examRelevance: 90,
        tags: ['Economy', 'GDP', 'Growth'],
        keyPoints: [
          'GDP growth projected at 6.5-7%',
          'Manufacturing sector showing resilience',
          'Services sector remains strong',
          'Focus on infrastructure development'
        ],
        examQuestions: [
          'What factors contribute to India\'s GDP growth?',
          'How does the economic survey impact policy decisions?'
        ],
        sourceUrl: '#'
      }
    ];

    return Response.json({
      success: true,
      articles: mockArticles,
      totalResults: mockArticles.length,
      page: 1,
      category: category,
      error: `API Error: ${error.message}`,
      fallback: true
    });
  }
}

// Helper functions for Indian exam context
function calculateExamRelevance(title: string, description: string): number {
  const examKeywords = [
    // Government & Politics
    'government', 'policy', 'parliament', 'supreme court', 'constitution', 'modi', 'bjp', 'congress',
    'lok sabha', 'rajya sabha', 'president', 'prime minister', 'chief minister', 'governor',
    
    // Economy & Finance
    'economy', 'gdp', 'inflation', 'budget', 'rbi', 'finance', 'tax', 'gst', 'banking',
    'rupee', 'stock market', 'sensex', 'nifty', 'fiscal', 'monetary',
    
    // International Relations
    'international', 'diplomacy', 'treaty', 'agreement', 'summit', 'china', 'pakistan',
    'usa', 'russia', 'g20', 'brics', 'saarc', 'asean', 'un', 'world bank', 'imf',
    
    // Science & Technology
    'isro', 'space', 'satellite', 'mission', 'research', 'innovation', 'digital india',
    'artificial intelligence', 'technology', 'startup', 'make in india',
    
    // Social Issues
    'education', 'health', 'environment', 'climate', 'pollution', 'renewable energy',
    'social justice', 'women empowerment', 'skill development', 'employment',
  ];

  const text = (title + ' ' + description).toLowerCase();
  const matches = examKeywords.filter(keyword => text.includes(keyword));
  
  // Base score + bonus for matches
  let score = 40 + (matches.length * 8);
  
  // Boost for high-priority topics
  if (text.includes('government') || text.includes('policy')) score += 25;
  if (text.includes('supreme court') || text.includes('parliament')) score += 20;
  if (text.includes('international') || text.includes('diplomacy')) score += 15;
  if (text.includes('economy') || text.includes('budget')) score += 20;
  if (text.includes('isro') || text.includes('space')) score += 15;
  if (text.includes('environment') || text.includes('climate')) score += 15;
  
  return Math.min(100, Math.max(0, score));
}

function determineImportance(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  // Critical importance indicators
  if (text.includes('breaking') || text.includes('urgent') || text.includes('emergency')) {
    return 'critical';
  }
  
  if (text.includes('supreme court') || text.includes('parliament') || 
      text.includes('budget') || text.includes('rbi') || text.includes('international summit')) {
    return 'critical';
  }
  
  // High importance indicators
  if (text.includes('government') || text.includes('policy') || text.includes('minister') ||
      text.includes('election') || text.includes('diplomatic') || text.includes('economic')) {
    return 'high';
  }
  
  return 'medium';
}

function extractKeyPoints(content: string): string[] {
  if (!content) return [];
  
  // Simple extraction - can be enhanced with AI
  const sentences = content.split(/[.!?]+/).filter(s => s.length > 30 && s.length < 200);
  return sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 0);
}

function extractTags(title: string, description: string): string[] {
  const text = (title + ' ' + description).toLowerCase();
  const tags = [];
  
  // Government & Politics
  if (text.includes('government') || text.includes('minister')) tags.push('Government');
  if (text.includes('parliament') || text.includes('lok sabha')) tags.push('Parliament');
  if (text.includes('supreme court') || text.includes('high court')) tags.push('Judiciary');
  if (text.includes('election') || text.includes('voting')) tags.push('Elections');
  
  // Economy
  if (text.includes('economy') || text.includes('gdp')) tags.push('Economy');
  if (text.includes('budget') || text.includes('finance')) tags.push('Finance');
  if (text.includes('rbi') || text.includes('monetary')) tags.push('Banking');
  
  // International
  if (text.includes('international') || text.includes('foreign')) tags.push('International');
  if (text.includes('china') || text.includes('pakistan')) tags.push('Bilateral Relations');
  
  // Science & Technology
  if (text.includes('isro') || text.includes('space')) tags.push('Space Technology');
  if (text.includes('artificial intelligence') || text.includes('digital')) tags.push('Technology');
  
  return tags.slice(0, 5);
}

function mapToOurCategory(title: string, description: string, requestedCategory: string): string {
  if (requestedCategory !== 'all') {
    return requestedCategory;
  }
  
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('government') || text.includes('parliament') || text.includes('minister')) {
    return 'politics';
  }
  
  if (text.includes('economy') || text.includes('budget') || text.includes('gdp')) {
    return 'economy';
  }
  
  if (text.includes('international') || text.includes('foreign') || text.includes('diplomatic')) {
    return 'international';
  }
  
  if (text.includes('science') || text.includes('technology') || text.includes('isro')) {
    return 'science';
  }
  
  return 'politics'; // Default
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(' ').length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function generateArticleId(url: string): string {
  return Buffer.from(url + Date.now()).toString('base64').slice(0, 16);
}

function generateExamQuestions(title: string, description: string): string[] {
  const questions = [];
  
  if (title.includes('government') || title.includes('policy')) {
    questions.push(`What is the significance of the policy mentioned in: "${title}"?`);
  }
  
  if (title.includes('international') || title.includes('agreement')) {
    questions.push(`What are the implications of this international development for India?`);
  }
  
  questions.push(`What are the key facts about: "${title}"?`);
  questions.push(`How is this development relevant for competitive exam preparation?`);
  
  return questions.slice(0, 3);
}