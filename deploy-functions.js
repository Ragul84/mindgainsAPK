const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_PROJECT_REF = 'your-project-ref'; // You'll need to replace this with your actual project ref
const SUPABASE_ACCESS_TOKEN = 'your-access-token'; // You'll need to get this from Supabase dashboard

// Function to deploy an edge function
async function deployFunction(functionName) {
  console.log(`🚀 Deploying ${functionName} function...`);
  
  const functionPath = path.join(__dirname, 'supabase', 'functions', functionName);
  
  if (!fs.existsSync(functionPath)) {
    console.error(`❌ Function directory not found: ${functionPath}`);
    return false;
  }
  
  try {
    // Create deployment payload
    const indexPath = path.join(functionPath, 'index.ts');
    const functionCode = fs.readFileSync(indexPath, 'utf8');
    
    // Deploy using Supabase Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/functions/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: functionName,
        source: functionCode,
        verify_jwt: false,
      }),
    });
    
    if (response.ok) {
      console.log(`✅ ${functionName} deployed successfully`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to deploy ${functionName}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deploying ${functionName}:`, error);
    return false;
  }
}

// Alternative deployment using curl (if you have Supabase CLI)
function deployWithCurl(functionName) {
  console.log(`🚀 Deploying ${functionName} with curl...`);
  
  try {
    const functionPath = path.join(__dirname, 'supabase', 'functions', functionName);
    const indexPath = path.join(functionPath, 'index.ts');
    
    if (!fs.existsSync(indexPath)) {
      console.error(`❌ Function file not found: ${indexPath}`);
      return false;
    }
    
    // Create a temporary deployment script
    const deployScript = `
curl -X POST "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/functions/${functionName}" \\
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${functionName}",
    "source": "$(cat ${indexPath} | sed 's/"/\\"/g' | tr -d '\\n')",
    "verify_jwt": false
  }'
`;
    
    console.log('Deployment script created. You can run it manually if needed.');
    console.log(deployScript);
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating deployment script for ${functionName}:`, error);
    return false;
  }
}

// Main deployment function
async function deployAllFunctions() {
  console.log('🔧 Starting Edge Functions deployment...\n');
  
  const functions = ['generate-quiz', 'analyze-quiz-performance'];
  
  for (const functionName of functions) {
    await deployFunction(functionName);
    console.log(''); // Add spacing
  }
  
  console.log('✨ Deployment process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Replace SUPABASE_PROJECT_REF with your actual project reference');
  console.log('2. Get your access token from Supabase dashboard');
  console.log('3. Set environment variables in Supabase dashboard:');
  console.log('   - OPENAI_API_KEY: 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');
  console.log('4. Test the functions in Supabase dashboard');
}

// Run deployment
deployAllFunctions().catch(console.error);