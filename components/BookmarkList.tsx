"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}

export default function BookmarkList({ userId }: { userId: string }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setBookmarks(data || []);
    };

    // Fetch immediately
    fetchBookmarks();

    // Then fetch every 2 seconds
    const interval = setInterval(fetchBookmarks, 2000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleDelete = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  return (
    <div className="mt-8 space-y-4">
      <p className="text-gray-400">Total: {bookmarks.length}</p>
      {bookmarks.map((b) => (
        <div key={b.id} className="p-4 bg-gray-800 rounded-xl flex justify-between items-center">
          <div className="flex-1">
            <a 
              href={b.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:underline"
            >
              {b.title}
            </a>
            <p className="text-xs text-gray-500 mt-1">{b.url}</p>
          </div>
          <button onClick={() => handleDelete(b.id)} className="text-xl ml-4">❌</button>
        </div>
      ))}
    </div>
  );
}