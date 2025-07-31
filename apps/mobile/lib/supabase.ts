import { createClient } from '@supabase/supabase-js';
import { config } from './config';

console.log('🔧 Creating Supabase client with config:', {
  url: config.supabase.url,
  anonKey: config.supabase.anonKey ? `${config.supabase.anonKey.substring(0, 20)}...` : 'MISSING'
});

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);
