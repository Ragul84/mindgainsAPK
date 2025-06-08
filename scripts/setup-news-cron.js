// Daily news update script - can be run via cron job or scheduled task

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const newsApiKey = process.env.NEWS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDailyNews() {
  console.log('🗞️ Starting daily news update...');
  
  const categories = ['general', 'business', 'technology', 'health', 'science'];
  
  for (const category of categories) {
    try {
      console.log(`📰 Fetching ${category} news...`);
      
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=in&category=${category}&pageSize=20&apiKey=${newsApiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'ok') {
        // Process and save articles
        for (const article of data.articles) {
          await saveArticle(article, category);
        }
        console.log(`✅ Saved ${data.articles.length} ${category} articles`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error fetching ${category} news:`, error);
    }
  }
  
  console.log('✨ Daily news update complete!');
}

async function saveArticle(article, category) {
  // Implementation similar to the API route
  // Save to news_articles table
}

// Run if called directly
if (require.main === module) {
  updateDailyNews().catch(console.error);
}

module.exports = { updateDailyNews };