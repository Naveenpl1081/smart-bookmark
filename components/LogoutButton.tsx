"use client";

import { createClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      onClick={logout}
      className="px-4 py-2 bg-red-600 rounded-xl"
    >
      Logout
    </button>
  );
}
