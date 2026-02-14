"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AddBookmarkForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addBookmark = async () => {
    if (!title.trim() || !url.trim()) {
      alert("Please enter both title and URL");
      return;
    }

    setIsAdding(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert([
          {
            title: title.trim(),
            url: url.trim(),
            user_id: userId,
          },
        ])
        .select();

      if (error) {
        console.error("Error adding bookmark:", error);
        alert("Failed to add bookmark: " + error.message);
      } else {
        console.log(" Bookmark added:", data);
        setTitle("");
        setUrl("");
        
        // Small delay to ensure realtime catches up
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An error occurred");
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      addBookmark();
    }
  };

  return (
    <div className="mt-8 flex gap-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Title"
        className="p-3 rounded-xl bg-gray-800 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isAdding}
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="https://example.com"
        className="p-3 rounded-xl bg-gray-800 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isAdding}
      />
      <button
        onClick={addBookmark}
        disabled={isAdding}
        className="px-8 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isAdding ? "Adding..." : "Add"}
      </button>
    </div>
  );
}