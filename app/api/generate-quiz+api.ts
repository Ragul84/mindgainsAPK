export async function POST(request: Request) {
  try {
    const { topic, examType, difficulty, questionCount, userId } = await request.json();
    
    // Validate input
    if (!topic || !examType || !difficulty || !questionCount || !userId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get Supabase configuration
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    // Validate Supabase URL format
    if (supabaseUrl.includes('your-project-ref') || supabaseUrl === 'your_supabase_project_url') {
      return Response.json(
        { success: false, error: 'Supabase URL not configured properly. Please set EXPO_PUBLIC_SUPABASE_URL in your .env file.' },
        { status: 500 }
      );
    }
    
    // Validate Supabase key format
    if (supabaseAnonKey.includes('your-actual-anon-key') || supabaseAnonKey === 'your_supabase_anon_key') {
      return Response.json(
        { success: false, error: 'Supabase anonymous key not configured properly. Please set EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.' },
        { status: 500 }
      );
    }
    
    // Call Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-quiz`;
    
    console.log('Calling edge function:', edgeFunctionUrl);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        examType,
        difficulty,
        questionCount,
        userId
      }),
    });
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error response:', response.status, errorText);
      
      // Check if we got HTML instead of JSON (common when function doesn't exist)
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
        return Response.json(
          { 
            success: false, 
            error: 'Edge function not found. Please ensure the generate-quiz function is deployed to your Supabase project.' 
          },
          { status: 500 }
        );
      }
      
      return Response.json(
        { 
          success: false, 
          error: `Edge function error: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      );
    }
    
    // Parse response as JSON
    let data;
    try {
      const responseText = await response.text();
      console.log('Edge function response:', responseText);
      
      // Check if response is HTML (error page)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        return Response.json(
          { 
            success: false, 
            error: 'Received HTML response instead of JSON. The edge function may not be properly deployed.' 
          },
          { status: 500 }
        );
      }
      
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return Response.json(
        { 
          success: false, 
          error: 'Invalid JSON response from edge function' 
        },
        { status: 500 }
      );
    }
    
    if (!data.success) {
      return Response.json(
        { 
          success: false, 
          error: data.error || 'Quiz generation failed' 
        },
        { status: 400 }
      );
    }
    
    return Response.json(data);
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}