import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Enable realtime debug logs (for development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Supabase client created');
  }

  return client;
}