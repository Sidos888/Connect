"use client";

import Button from "@/components/Button";
import ImagePicker from "@/components/ImagePicker";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const { setPersonalProfile, isHydrated } = useAppStore();
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Wait for store to hydrate before rendering
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      setPersonalProfile({ 
        id: 'temp-id', 
        name, 
        bio, 
        avatarUrl, 
        email: '', 
        phone: '', 
        dateOfBirth: '', 
        connectId: 'TEMP', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
      // TODO: replace with Supabase profile upsert
      router.replace("/");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-6">
      <h1 className="text-xl font-semibold mb-2">Welcome to Connect</h1>
      <p className="text-sm text-neutral-600 mb-6">Create your personal profile to get started.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ImagePicker label="Avatar" onChange={(_, url) => setAvatarUrl(url)} />
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        <Button type="submit" disabled={saving || !name} className="w-full">
          {saving ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}


