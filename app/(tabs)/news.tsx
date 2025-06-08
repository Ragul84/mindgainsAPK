import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNews } from '@/hooks/useNews';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {
  Newspaper,
  Clock,
  TrendingUp,
  Globe,
  Users,
  BookOpen,
  Calendar,
  Tag,
  ArrowRight,
  Filter,
  Search,
  Star,
  Share,
  Bookmark,
  Play,
  Mic,
  Eye,
  MessageSquare,
  X,
  ChevronDown,
  Zap,
  Target,
  Award,
  Sparkles,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function NewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedNews, setBookmarkedNews] = useState(new Set());
  const [readNews, setReadNews] = useState(new Set());

  const { 
    news, 
    todaysHighlights, 
    loading, 
    error, 
    fetchNews, 
    searchNews, 
    getNewsByCategory,
    refreshNews,
    lastFetchTime 
  } = useNews();

  // Animation values
  const headerOpacity = useSharedValue(1);
  const searchScale = useSharedValue(1);
  const refreshRotation = useSharedValue(0);

  const categories = [
    { id: 'all', name: 'All News', icon: Globe, color: '#3B82F6' },
    { id: 'politics', name: 'Politics', icon: Users, color: '#EF4444' },
    { id: 'economy', name: 'Economy', icon: TrendingUp, color: '#10B981' },
    { id: 'international', name: 'International', icon: Globe, color: '#8B5CF6' },
    { id: 'science', name: 'Science & Tech', icon: Zap, color: '#F59E0B' },
    { id: 'environment', name: 'Environment', icon: Target, color: '#06B6D4' },
    { id: 'sports', name: 'Sports', icon: Award, color: '#EC4899' },
  ];

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchNews(categoryId);
  };

  const handleRefresh = () => {
    refreshRotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      1,
      false
    );
    refreshNews();
  };

  const animatedRefreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshRotation.value}deg` }],
  }));

  // Enhanced News Card Component
  const NewsCard = ({ news, isHighlight = false }: { news: any; isHighlight?: boolean }) => {
    const scale = useSharedValue(1);
    const isRead = readNews.has(news.id);
    const isBookmarked = bookmarkedNews.has(news.id);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    };

    const handlePress = () => {
      setSelectedNews(news);
      setNewsModalVisible(true);
      setReadNews(prev => new Set([...prev, news.id]));
    };

    const toggleBookmark = () => {
      setBookmarkedNews(prev => {
        const newSet = new Set(prev);
        if (newSet.has(news.id)) {
          newSet.delete(news.id);
        } else {
          newSet.add(news.id);
        }
        return newSet;
      });
    };

    const getImportanceColor = (importance: string) => {
      switch (importance) {
        case 'critical': return '#EF4444';
        case 'high': return '#F59E0B';
        case 'medium': return '#10B981';
        default: return '#6B7280';
      }
    };

    const getCategoryIcon = (category: string) => {
      const categoryData = categories.find(c => c.id === category);
      return categoryData?.icon || Newspaper;
    };

    const Icon = getCategoryIcon(news.category);

    return (
      <AnimatedTouchableOpacity
        style={[
          isHighlight ? styles.highlightCard : styles.newsCard,
          animatedStyle,
          { opacity: isRead ? 0.7 : 1 }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <LinearGradient
          colors={
            isHighlight 
              ? ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']
              : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
          }
          style={styles.newsCardGradient}
        >
          {/* News Image */}
          <View style={styles.newsImageContainer}>
            <Image 
              source={{ uri: news.imageUrl }} 
              style={styles.newsImage}
              resizeMode="cover"
            />
            
            {/* Importance Badge */}
            <View style={[
              styles.importanceBadge,
              { backgroundColor: getImportanceColor(news.importance) }
            ]}>
              <Text style={styles.importanceBadgeText}>
                {news.importance?.toUpperCase()}
              </Text>
            </View>

            {/* Exam Relevance Score */}
            <View style={styles.examRelevanceScore}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.examRelevanceText}>{news.examRelevance}%</Text>
            </View>

            {/* Live Badge for recent news */}
            {new Date(news.publishedAt).getTime() > Date.now() - 2 * 60 * 60 * 1000 && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* News Content */}
          <View style={styles.newsContent}>
            <View style={styles.newsHeader}>
              <View style={styles.categoryBadge}>
                <Icon size={14} color="#00FF88" strokeWidth={2} />
                <Text style={styles.categoryText}>
                  {categories.find(c => c.id === news.category)?.name || news.category}
                </Text>
              </View>
              
              <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
                <Bookmark 
                  size={16} 
                  color={isBookmarked ? '#F59E0B' : '#9CA3AF'} 
                  fill={isBookmarked ? '#F59E0B' : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.newsTitle} numberOfLines={2}>
              {news.title}
            </Text>
            
            <Text style={styles.newsSummary} numberOfLines={2}>
              {news.summary}
            </Text>

            {/* Key Points Preview */}
            {news.keyPoints && news.keyPoints.length > 0 && (
              <View style={styles.keyPointsPreview}>
                <Text style={styles.keyPointsLabel}>Key Points:</Text>
                <Text style={styles.keyPointsText} numberOfLines={1}>
                  • {news.keyPoints[0]}
                </Text>
              </View>
            )}

            {/* News Meta */}
            <View style={styles.newsMeta}>
              <View style={styles.newsMetaLeft}>
                <View style={styles.newsMetaItem}>
                  <Clock size={12} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.newsMetaText}>{news.readTime} min</Text>
                </View>
                <View style={styles.newsMetaItem}>
                  <Calendar size={12} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.newsMetaText}>
                    {new Date(news.publishedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.newsMetaItem}>
                  <Text style={styles.sourceText}>{news.source}</Text>
                </View>
              </View>
              
              <View style={styles.newsActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Share size={14} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Eye size={14} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  };

  // Today's Highlights Section
  const TodaysHighlights = () => (
    <View style={styles.highlightsSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <TrendingUp size={24} color="#EF4444" strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Today's Highlights</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Critical for exam preparation</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {todaysHighlights.map((highlight) => (
          <TouchableOpacity 
            key={highlight.id} 
            style={styles.highlightItemCard}
            onPress={() => {
              if (highlight.article) {
                setSelectedNews(highlight.article);
                setNewsModalVisible(true);
              }
            }}
          >
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.highlightItemGradient}
            >
              <View style={styles.highlightItemHeader}>
                <View style={styles.highlightImportanceIndicator}>
                  <Text style={styles.highlightImportanceText}>
                    {highlight.importance?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.highlightExamWeight}>{highlight.examWeight}%</Text>
              </View>
              
              <Text style={styles.highlightItemTitle}>{highlight.title}</Text>
              <Text style={styles.highlightItemDescription}>{highlight.description}</Text>
              
              <View style={styles.highlightItemAction}>
                <Text style={styles.highlightActionText}>Read Details</Text>
                <ArrowRight size={14} color="#EF4444" strokeWidth={2} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // AI Summary Section
  const AISummarySection = () => (
    <View style={styles.aiSummarySection}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
        style={styles.aiSummaryCard}
      >
        <View style={styles.aiSummaryHeader}>
          <View style={styles.aiSummaryTitleContainer}>
            <Sparkles size={24} color="#8B5CF6" strokeWidth={2.5} />
            <Text style={styles.aiSummaryTitle}>AI Daily Brief</Text>
          </View>
          <TouchableOpacity style={styles.aiSummaryPlayButton}>
            <Play size={16} color="#8B5CF6" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.aiSummaryText}>
          "Today's key developments include {todaysHighlights.length > 0 ? todaysHighlights[0].title.toLowerCase() : 'government policy updates'}, 
          economic indicators, and international relations. Focus on policy implementations and 
          bilateral agreements for upcoming exams."
        </Text>
        
        <View style={styles.aiSummaryActions}>
          <TouchableOpacity style={styles.aiActionButton}>
            <Mic size={14} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.aiActionText}>Listen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.aiActionButton}>
            <BookOpen size={14} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.aiActionText}>Full Summary</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // News Detail Modal
  const NewsDetailModal = () => {
    if (!selectedNews) return null;

    return (
      <Modal
        visible={newsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setNewsModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>News Details</Text>
            <TouchableOpacity style={styles.modalShareButton}>
              <Share size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Image 
              source={{ uri: selectedNews.imageUrl }} 
              style={styles.modalImage}
              resizeMode="cover"
            />
            
            <View style={styles.modalNewsContent}>
              <View style={styles.modalNewsHeader}>
                <Text style={styles.modalNewsCategory}>{selectedNews.category?.toUpperCase()}</Text>
                <Text style={styles.modalNewsSource}>{selectedNews.source}</Text>
              </View>
              
              <Text style={styles.modalNewsTitle}>{selectedNews.title}</Text>
              <Text style={styles.modalNewsSummary}>{selectedNews.summary}</Text>
              
              {/* Key Points Section */}
              {selectedNews.keyPoints && selectedNews.keyPoints.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Key Points for Exams</Text>
                  {selectedNews.keyPoints.map((point: string, index: number) => (
                    <View key={index} style={styles.keyPointItem}>
                      <View style={styles.keyPointBullet} />
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Exam Questions Section */}
              {selectedNews.examQuestions && selectedNews.examQuestions.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Possible Exam Questions</Text>
                  {selectedNews.examQuestions.map((question: string, index: number) => (
                    <View key={index} style={styles.examQuestionItem}>
                      <Text style={styles.examQuestionText}>Q{index + 1}. {question}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Tags Section */}
              {selectedNews.tags && selectedNews.tags.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Related Topics</Text>
                  <View style={styles.tagsContainer}>
                    {selectedNews.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tagItem}>
                        <Tag size={12} color="#8B5CF6" strokeWidth={2} />
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Full Content */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Full Article</Text>
                <Text style={styles.modalFullContent}>{selectedNews.content}</Text>
              </View>

              {/* Source Link */}
              <TouchableOpacity style={styles.sourceButton}>
                <Text style={styles.sourceButtonText}>Read Original Article</Text>
                <ArrowRight size={16} color="#8B5CF6" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Search and Filter Header
  const SearchFilterHeader = () => {
    const animatedSearchStyle = useAnimatedStyle(() => ({
      transform: [{ scale: searchScale.value }],
    }));

    const handleSearchPress = () => {
      searchScale.value = withSequence(
        withSpring(0.95, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
      setSearchModalVisible(true);
    };

    return (
      <View style={styles.searchFilterContainer}>
        <AnimatedTouchableOpacity
          style={[styles.searchButton, animatedSearchStyle]}
          onPress={handleSearchPress}
        >
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <Text style={styles.searchButtonText}>Search current affairs...</Text>
        </AnimatedTouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color="#00FF88" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Animated.View style={animatedRefreshStyle}>
            <RefreshCw size={20} color="#8B5CF6" strokeWidth={2} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  // Category Filter Pills
  const CategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const Icon = category.icon;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryPill,
                isSelected && { backgroundColor: category.color + '20', borderColor: category.color + '40' }
              ]}
              onPress={() => handleCategoryChange(category.id)}
            >
              <Icon 
                size={16} 
                color={isSelected ? category.color : '#9CA3AF'} 
                strokeWidth={2} 
              />
              <Text style={[
                styles.categoryPillText,
                { color: isSelected ? category.color : '#9CA3AF' }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Connection Status
  const ConnectionStatus = () => (
    <View style={styles.connectionStatus}>
      <View style={styles.connectionIndicator}>
        {error ? (
          <>
            <WifiOff size={16} color="#EF4444" strokeWidth={2} />
            <Text style={styles.connectionText}>Connection Error</Text>
          </>
        ) : (
          <>
            <Wifi size={16} color="#10B981" strokeWidth={2} />
            <Text style={styles.connectionText}>Live Updates</Text>
          </>
        )}
      </View>
      {lastFetchTime > 0 && (
        <Text style={styles.lastUpdateText}>
          Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  const filteredNews = getNewsByCategory(selectedCategory);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <WifiOff size={48} color="#EF4444" strokeWidth={2} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Current Affairs</Text>
            <Text style={styles.headerSubtitle}>Live Indian news for competitive exams</Text>
          </View>
        </View>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Search and Filter */}
        <SearchFilterHeader />

        {/* AI Daily Brief */}
        <AISummarySection />

        {/* Today's Highlights */}
        <TodaysHighlights />

        {/* Category Filter */}
        <CategoryFilter />

        {/* News List */}
        <View style={styles.newsSection}>
          <View style={styles.newsSectionHeader}>
            <Text style={styles.newsSectionTitle}>
              {selectedCategory === 'all' ? 'All News' : categories.find(c => c.id === selectedCategory)?.name}
            </Text>
            <Text style={styles.newsSectionCount}>
              {filteredNews.length} articles
            </Text>
          </View>

          {loading && filteredNews.length === 0 ? (
            <View style={styles.loadingContainer}>
              <RefreshCw size={32} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.loadingText}>Fetching latest news...</Text>
            </View>
          ) : (
            filteredNews.map((newsItem) => (
              <NewsCard key={newsItem.id} news={newsItem} />
            ))
          )}
        </View>

        {/* News Detail Modal */}
        <NewsDetailModal />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  connectionStatus: {
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 6,
  },
  lastUpdateText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiSummarySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  aiSummaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSummaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSummaryTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  aiSummaryPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSummaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 16,
  },
  aiSummaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiActionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  highlightsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  highlightItemCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  highlightItemGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
  },
  highlightItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightImportanceIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highlightImportanceText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  highlightExamWeight: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#EF4444',
  },
  highlightItemTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  highlightItemDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  highlightItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightActionText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  categoryFilter: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  newsSection: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newsSectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  newsSectionCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 12,
  },
  newsCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  highlightCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  newsCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  newsImageContainer: {
    position: 'relative',
    height: 200,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  importanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  importanceBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  examRelevanceScore: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  examRelevanceText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  liveBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#00FF88',
    marginLeft: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  newsTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  newsSummary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  keyPointsPreview: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00FF88',
  },
  keyPointsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  keyPointsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsMetaLeft: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  newsMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  newsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  modalShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalNewsContent: {
    padding: 24,
  },
  modalNewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalNewsCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  modalNewsSource: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  modalNewsTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 12,
  },
  modalNewsSummary: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF88',
    marginTop: 8,
    marginRight: 12,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  examQuestionItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  examQuestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  modalFullContent: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 24,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  sourceButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginRight: 8,
  },
});