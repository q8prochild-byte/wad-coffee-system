import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'إعدادات Supabase غير موجودة. تأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env.local (محليًا) وفي إعدادات Environment Variables على Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
