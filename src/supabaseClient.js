// Supabase Client Configuration
// This file initializes the Supabase client for database operations
// 
// Setup Instructions:
// 1. Create account at https://supabase.com
// 2. Create a new project
// 3. Go to Settings → API
// 4. Copy Project URL and anon/public key
// 5. Add to .env file:
//    REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
//    REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set. Using localStorage fallback.')
  console.warn('   To enable cloud database:')
  console.warn('   1. Create .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY')
  console.warn('   2. Restart the development server')
} else {
  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format. Should be: https://xxxxx.supabase.co')
    console.error('   Current URL:', supabaseUrl)
  } else {
    console.log('✅ Supabase configured. URL:', supabaseUrl.substring(0, 30) + '...')
  }
  
  // Validate key format
  if (supabaseAnonKey.length < 100) {
    console.error('❌ Supabase anon key seems too short. Please check your .env file.')
  }
}

// Create Supabase client
// If env vars are missing, this will be null and we'll use localStorage
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}

// Helper function to get storage mode (database or localStorage)
export const getStorageMode = () => {
  return isSupabaseConfigured() ? 'database' : 'localStorage'
}

