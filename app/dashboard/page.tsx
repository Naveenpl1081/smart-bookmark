import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import BookmarkList from "@/components/BookmarkList";


export default async function Dashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Bookmarks</h1>
        <LogoutButton />
      </div>

      <AddBookmarkForm userId={user.id} />
      <BookmarkList userId={user.id} />
    </div>
  );
}
