import { Navbar } from "@/components/layout/navbar";
import { ChatWindow } from "@/components/chat/chat-window";
import { getSessionUser } from "@/lib/auth";

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const user = getSessionUser();
  if (!user) {
    return <main className="p-6">Unauthorized</main>;
  }

  return (
    <main className="min-h-screen">
      <Navbar isAdmin={user.role === "ADMIN"} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <ChatWindow matchId={params.matchId} currentUserId={user.id} />
      </div>
    </main>
  );
}
