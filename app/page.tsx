import LoginButton from "@/components/LoginButton";


export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">Smart Bookmark</h1>
        <p className="text-gray-400">Save your favorite links privately</p>
        <LoginButton />
      </div>
    </div>
  );
}
