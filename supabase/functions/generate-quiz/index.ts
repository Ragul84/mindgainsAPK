import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuizRequest {
  topic: string;
  examType: string;
  difficulty: string;
  questionCount: number;
  userId: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  points: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 AI Quiz generation request received')
    const { topic, examType, difficulty, questionCount, userId }: QuizRequest = await req.json()

    // Validate input
    if (!topic || !examType || !difficulty || !questionCount || !userId) {
      console.error('❌ Missing required fields:', { topic, examType, difficulty, questionCount, userId })
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

    console.log('📝 Generating AI quiz for:', { topic, examType, difficulty, questionCount })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate quiz questions using OpenAI (no limits check)
    const questions = await generateAIQuizQuestions(topic, examType, difficulty, questionCount)

    console.log('✅ Generated AI questions:', questions.length)

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
        questions: questions,
        metadata: {
          topic,
          examType,
          difficulty,
          questionCount: questions.length,
          generatedAt: new Date().toISOString(),
          generatedBy: 'openai'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ AI Quiz generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to generate AI quiz questions',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateAIQuizQuestions(topic: string, examType: string, difficulty: string, questionCount: number) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }

  const difficultyMap = {
    'beginner': 'basic level suitable for beginners',
    'intermediate': 'intermediate level with moderate complexity',
    'advanced': 'advanced level requiring deep understanding'
  }

  const examTypeContext = getExamTypeContext(examType)
  
  const prompt = `Generate ${questionCount} multiple choice questions about "${topic}" for ${examType} exam preparation.

Requirements:
- Difficulty: ${difficultyMap[difficulty as keyof typeof difficultyMap]}
- Format: Multiple choice with 4 options each
- Style: ${examTypeContext}
- Include detailed explanations for correct answers
- Questions should be factual, accurate, and exam-relevant
- Cover different aspects of the topic
- Avoid repetitive question patterns

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong."
  }
]

Topic: ${topic}
Exam Type: ${examType}
Difficulty: ${difficulty}
Number of questions: ${questionCount}`

  try {
    console.log('🤖 Calling OpenAI API...')
    
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
            content: 'You are an expert quiz generator for Indian competitive exams. Generate accurate, well-researched questions with detailed explanations. Return only valid JSON.'
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
    let questionsData
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      questionsData = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.error('Content that failed to parse:', content)
      throw new Error('Failed to parse OpenAI response as JSON')
    }

    if (!Array.isArray(questionsData)) {
      throw new Error('OpenAI response is not an array of questions')
    }

    // Validate and format questions
    const formattedQuestions = questionsData.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
          typeof q.correct_answer !== 'number' || !q.explanation) {
        throw new Error(`Invalid question format at index ${index}`)
      }

      return {
        id: `ai_${Date.now()}_${index}`,
        category: topic,
        difficulty: difficulty,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: getDifficultyPoints(difficulty),
        exam_type: examType,
        generated_by: 'openai',
        created_at: new Date().toISOString()
      }
    })

    console.log(`✅ Successfully generated ${formattedQuestions.length} AI questions`)
    return formattedQuestions

  } catch (error) {
    console.error('❌ OpenAI generation failed:', error)
    throw new Error(`AI generation failed: ${error.message}`)
  }
}

function getExamTypeContext(examType: string): string {
  const contexts = {
    'UPSC Civil Services': 'Focus on analytical thinking, current affairs integration, and comprehensive understanding. Questions should test conceptual clarity and application.',
    'SSC CGL': 'Emphasize factual knowledge, quick recall, and standard format questions typical of SSC exams.',
    'SSC CHSL': 'Focus on fundamental concepts with moderate difficulty, suitable for 12th pass level.',
    'Railway NTPC': 'Include practical applications and technical aspects relevant to railway operations.',
    'Banking PO': 'Emphasize logical reasoning, current affairs, and financial awareness integration.',
    'Banking Clerk': 'Focus on basic banking concepts and general awareness with moderate complexity.',
    'State PSC': 'Include state-specific context and local relevance while maintaining general applicability.',
    'NDA': 'Military context with emphasis on leadership, strategy, and national security aspects.',
    'CDS': 'Defense-oriented questions with focus on military history and strategic thinking.',
    'AFCAT': 'Air Force specific context with emphasis on aviation and aerospace knowledge.',
    'IBPS': 'Banking sector focus with emphasis on financial literacy and economic awareness.',
    'SBI PO': 'State Bank specific context with comprehensive banking and economic knowledge.'
  }
  
  return contexts[examType] || 'Standard competitive exam format with emphasis on conceptual understanding and practical application.'
}

function getDifficultyPoints(difficulty: string): number {
  switch (difficulty) {
    case 'beginner': return 5
    case 'intermediate': return 10
    case 'advanced': return 15
    default: return 10
  }
}