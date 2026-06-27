import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnrujkbvpltffetvmsbn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucnVqa2J2cGx0ZmZldHZtc2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDcwMTcsImV4cCI6MjA5ODA4MzAxN30.mzDuHz7Bfe_W0YjF3luOM0CxaK-q686sl2w16RDHQes';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
