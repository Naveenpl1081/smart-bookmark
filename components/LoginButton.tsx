"use client";

import { createClient } from "@/lib/supabase-browser";

export default function LoginButton() {
  const supabase = createClient();

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={login}
      className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition"
    >
      Login with Google
    </button>
  );
}
