"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function ClaimPage({ params }: { params: { itemId: string } }) {
  const [answers, setAnswers] = useState("What unique mark does your item have?");
  const [claimId, setClaimId] = useState("");

  const requestClaim = async () => {
    const response = await fetch(`/api/items/${params.itemId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answers.split("\n").filter(Boolean) }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error ?? "Claim failed");
      return;
    }
    setClaimId(data.claim.id);
    alert("Claim request submitted");
  };

  const updateClaim = async (action: "APPROVE" | "REJECT" | "COMPLETE") => {
    if (!claimId) {
      alert("Create claim first");
      return;
    }
    const response = await fetch(`/api/items/${params.itemId}/claim`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action }),
    });
    if (response.ok) {
      alert(`Claim ${action.toLowerCase()}d`);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card className="space-y-3">
          <h1 className="text-2xl font-semibold">Secure Claim Verification</h1>
          <p className="text-sm text-slate-500">Step 1: Lost person clicks “This is Mine”. Step 2: answers verification questions. Step 3: found user approves. Step 4: mark returned. Step 5: rate each other.</p>
          <Textarea value={answers} onChange={(event) => setAnswers(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={requestClaim}>This is Mine</Button>
            <Button variant="outline" onClick={() => updateClaim("APPROVE")}>Approve</Button>
            <Button variant="outline" onClick={() => updateClaim("REJECT")}>Reject</Button>
            <Button variant="outline" onClick={() => updateClaim("COMPLETE")}>Mark Returned</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
