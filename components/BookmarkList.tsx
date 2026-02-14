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
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setBookmarks(data || []);
    };

    // Initial fetch
    fetchBookmarks();

    // Polling fallback - fetch every 3 seconds
    const interval = setInterval(fetchBookmarks, 3000);

    // Try realtime subscription (works in Safari, might work in Chrome)
    const channel = supabase
      .channel('public:bookmarks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload: any) => {
          console.log(' INSERT received via realtime:', payload);
          if (payload.new.user_id === userId) {
            setBookmarks((current) => {
              const exists = current.some(b => b.id === payload.new.id);
              if (exists) return current;
              return [payload.new, ...current];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload: any) => {
          console.log(' DELETE received via realtime:', payload);
          setBookmarks((current) => current.filter((b) => b.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          console.log('Realtime connected');
        }
      });

    return () => {
      clearInterval(interval);
      setIsSubscribed(false);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">Total: {bookmarks.length}</p>
        <p className="text-xs text-gray-500">
          {isSubscribed ? '🟢 Live' : '🟡 Polling'}
        </p>
      </div>
      
      {bookmarks.length === 0 && (
        <div className="text-center py-12 bg-gray-800 rounded-xl">
          <p className="text-gray-500">No bookmarks yet</p>
          <p className="text-gray-600 text-sm mt-2">Add one above! ⬆️</p>
        </div>
      )}
      
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