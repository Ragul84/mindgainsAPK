const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Additional topics to prepare
const topicsToGenerate = [
  // History
  { topic: 'Mughal Empire', category: 'History', difficulty: 'intermediate', priority: 9 },
  { topic: 'Gupta Empire', category: 'History', difficulty: 'intermediate', priority: 8 },
  { topic: 'Chola Dynasty', category: 'History', difficulty: 'intermediate', priority: 7 },
  { topic: 'Vijayanagara Empire', category: 'History', difficulty: 'intermediate', priority: 7 },
  { topic: 'Maratha Empire', category: 'History', difficulty: 'intermediate', priority: 8 },
  { topic: 'British East India Company', category: 'History', difficulty: 'advanced', priority: 9 },
  { topic: 'Indian Independence Movement', category: 'History', difficulty: 'advanced', priority: 10 },
  { topic: 'Partition of India', category: 'History', difficulty: 'advanced', priority: 8 },
  
  // Polity
  { topic: 'Indian Constitution', category: 'Polity', difficulty: 'advanced', priority: 10 },
  { topic: 'Directive Principles of State Policy', category: 'Polity', difficulty: 'advanced', priority: 8 },
  { topic: 'Panchayati Raj System', category: 'Polity', difficulty: 'intermediate', priority: 7 },
  { topic: 'Indian Parliament', category: 'Polity', difficulty: 'intermediate', priority: 8 },
  { topic: 'Supreme Court of India', category: 'Polity', difficulty: 'advanced', priority: 7 },
  { topic: 'President of India', category: 'Polity', difficulty: 'intermediate', priority: 6 },
  { topic: 'Prime Minister of India', category: 'Polity', difficulty: 'intermediate', priority: 6 },
  
  // Economics
  { topic: 'Five Year Plans', category: 'Economics', difficulty: 'intermediate', priority: 8 },
  { topic: 'Green Revolution', category: 'Economics', difficulty: 'intermediate', priority: 7 },
  { topic: 'Economic Liberalization 1991', category: 'Economics', difficulty: 'advanced', priority: 8 },
  { topic: 'GST (Goods and Services Tax)', category: 'Economics', difficulty: 'intermediate', priority: 7 },
  { topic: 'Reserve Bank of India', category: 'Economics', difficulty: 'intermediate', priority: 7 },
  { topic: 'Banking System in India', category: 'Economics', difficulty: 'intermediate', priority: 6 },
  
  // Geography
  { topic: 'Indian Monsoon', category: 'Geography', difficulty: 'intermediate', priority: 8 },
  { topic: 'Himalayan Mountain System', category: 'Geography', difficulty: 'intermediate', priority: 7 },
  { topic: 'Indian Rivers', category: 'Geography', difficulty: 'beginner', priority: 7 },
  { topic: 'Climate of India', category: 'Geography', difficulty: 'intermediate', priority: 6 },
  { topic: 'Natural Resources of India', category: 'Geography', difficulty: 'intermediate', priority: 6 },
  
  // Current Affairs
  { topic: 'Digital India Initiative', category: 'Current Affairs', difficulty: 'intermediate', priority: 8 },
  { topic: 'Make in India', category: 'Current Affairs', difficulty: 'intermediate', priority: 7 },
  { topic: 'Swachh Bharat Mission', category: 'Current Affairs', difficulty: 'beginner', priority: 6 },
  { topic: 'Ayushman Bharat', category: 'Current Affairs', difficulty: 'intermediate', priority: 6 },
  { topic: 'National Education Policy 2020', category: 'Current Affairs', difficulty: 'intermediate', priority: 7 },
];

// Function to generate AI content for a topic
async function generateTopicContent(topic, category, difficulty) {
  const prompt = `Create a comprehensive breakdown of the topic "${topic}" for UPSC/competitive exam preparation.

Provide a detailed analysis in the following JSON structure:

{
  "overview": "A comprehensive 2-3 paragraph overview of the topic",
  "timeline": [
    {"year": "Year/Period", "event": "Important event description"}
  ],
  "keyPeople": [
    {"name": "Person Name", "role": "Their role/title", "description": "Brief description of their contribution"}
  ],
  "dynasties": [
    {"name": "Dynasty Name", "founder": "Founder Name", "period": "Time Period", "capital": "Capital City"}
  ],
  "importantFacts": [
    "Important fact 1",
    "Important fact 2"
  ],
  "causes": [
    {"cause": "Cause description", "effect": "Effect description"}
  ],
  "significance": [
    "Historical significance point 1",
    "Historical significance point 2"
  ]
}

Requirements:
- Focus on UPSC/competitive exam relevance
- Include dates, names, and specific details
- Provide at least 5-8 items for each array
- Make it comprehensive but concise
- Include both causes and effects where applicable
- If dynasties don't apply to the topic, provide an empty array
- Ensure all information is factually accurate

Topic: ${topic}
Category: ${category}
Difficulty: ${difficulty}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator specializing in Indian history, polity, geography, economics, and current affairs for UPSC preparation. Provide comprehensive, accurate, and exam-focused content. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Clean and parse JSON
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
    
  } catch (error) {
    console.error(`Error generating content for ${topic}:`, error);
    return null;
  }
}

// Function to save note to database
async function saveNoteToDatabase(topic, category, difficulty, content, priority) {
  try {
    // Generate tags from the content
    const tags = [
      category,
      difficulty,
      ...content.keyPeople.slice(0, 3).map(p => p.name),
      ...content.timeline.slice(0, 2).map(t => t.year)
    ].filter(Boolean);

    const { data, error } = await supabase
      .from('pre_generated_notes')
      .insert({
        topic,
        category,
        difficulty,
        content,
        priority,
        tags,
        status: 'published',
        estimated_read_time: Math.max(10, Math.min(30, content.importantFacts.length * 2))
      })
      .select()
      .single();

    if (error) {
      console.error(`Error saving ${topic}:`, error);
      return null;
    }

    // Add to suggestions
    await supabase
      .from('note_suggestions')
      .insert({
        note_id: data.id,
        category,
        display_order: priority,
        is_featured: priority >= 8
      });

    console.log(`✅ Saved: ${topic}`);
    return data;
    
  } catch (error) {
    console.error(`Error saving ${topic}:`, error);
    return null;
  }
}

// Main function to prepare all notes
async function prepareAllNotes() {
  console.log('🚀 Starting note preparation...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const topicData of topicsToGenerate) {
    console.log(`📝 Generating: ${topicData.topic}...`);
    
    // Check if topic already exists
    const { data: existing } = await supabase
      .from('pre_generated_notes')
      .select('id')
      .eq('topic', topicData.topic)
      .single();

    if (existing) {
      console.log(`⏭️  Skipping ${topicData.topic} - already exists`);
      continue;
    }

    const content = await generateTopicContent(
      topicData.topic, 
      topicData.category, 
      topicData.difficulty
    );

    if (content) {
      const saved = await saveNoteToDatabase(
        topicData.topic,
        topicData.category,
        topicData.difficulty,
        content,
        topicData.priority
      );

      if (saved) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      errorCount++;
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✨ Note preparation complete!`);
  console.log(`✅ Successfully generated: ${successCount} notes`);
  console.log(`❌ Errors: ${errorCount} notes`);
  console.log(`\n📚 Notes are now available in the study room!`);
}

// Run the script
if (require.main === module) {
  prepareAllNotes().catch(console.error);
}

module.exports = { prepareAllNotes, generateTopicContent, saveNoteToDatabase };