import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TopicRequest {
  topic: string;
  userId: string;
}

interface TopicBreakdown {
  overview: string;
  timeline: Array<{ year: string; event: string }>;
  keyPeople: Array<{ name: string; role: string; description: string }>;
  dynasties: Array<{ name: string; founder: string; period: string; capital: string }>;
  importantFacts: string[];
  causes: Array<{ cause: string; effect: string }>;
  significance: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 AI Topic breakdown request received')
    const { topic, userId }: TopicRequest = await req.json()

    // Validate input
    if (!topic || !userId) {
      console.error('❌ Missing required fields:', { topic, userId })
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📝 Generating AI topic breakdown for:', { topic, userId })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate topic breakdown using OpenAI (no limits check)
    const breakdown = await generateAITopicBreakdown(topic)

    console.log('✅ Generated AI topic breakdown')

    // Store generation record for analytics (optional)
    await supabase
      .from('smart_notes_generations')
      .insert({
        user_id: userId,
        generated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        breakdown: breakdown,
        metadata: {
          topic,
          generatedAt: new Date().toISOString(),
          generatedBy: 'openai'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ AI Topic breakdown error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to generate AI topic breakdown',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateAITopicBreakdown(topic: string): Promise<TopicBreakdown> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }

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

Topic: ${topic}`

  try {
    console.log('🤖 Calling OpenAI API for topic breakdown...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
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
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    console.log('✅ OpenAI response received')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI')
    }

    const content = data.choices[0].message.content.trim()
    console.log('📝 Raw OpenAI content:', content.substring(0, 200) + '...')

    // Parse the JSON response
    let breakdown
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      breakdown = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.error('Content that failed to parse:', content)
      throw new Error('Failed to parse OpenAI response as JSON')
    }

    // Validate the structure
    if (!breakdown.overview || !Array.isArray(breakdown.timeline) || 
        !Array.isArray(breakdown.keyPeople) || !Array.isArray(breakdown.importantFacts)) {
      throw new Error('Invalid breakdown structure from OpenAI')
    }

    // Ensure all required arrays exist
    breakdown.dynasties = breakdown.dynasties || []
    breakdown.causes = breakdown.causes || []
    breakdown.significance = breakdown.significance || []

    console.log(`✅ Successfully generated topic breakdown for: ${topic}`)
    return breakdown

  } catch (error) {
    console.error('❌ OpenAI generation failed:', error)
    throw new Error(`AI generation failed: ${error.message}`)
  }
}