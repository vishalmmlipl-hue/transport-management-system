/**
 * Supabase Client - DISABLED
 * 
 * This app uses Render.com API, not Supabase.
 * This file is kept for compatibility but does nothing.
 */

// Disable Supabase - app uses Render.com API
export const isSupabaseConfigured = () => {
  return false; // Always return false - not using Supabase
};

// Mock supabase client (does nothing)
export const supabase = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: { message: 'Supabase disabled - use Render.com API' } }),
    update: () => ({ data: null, error: { message: 'Supabase disabled - use Render.com API' } }),
    delete: () => ({ data: null, error: { message: 'Supabase disabled - use Render.com API' } }),
  }),
};

// No warning - silently disabled
console.log('ℹ️ Supabase disabled - app uses Render.com API');
