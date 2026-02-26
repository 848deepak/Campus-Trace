import { Navbar } from "@/components/layout/navbar";
import { ItemForm } from "@/components/forms/item-form";

export default function PostLostPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <ItemForm type="LOST" />
      </div>
    </main>
  );
}
