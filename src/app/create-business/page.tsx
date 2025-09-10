"use client";

import Button from "@/components/Button";
import ImagePicker from "@/components/ImagePicker";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function CreateBusinessPage() {
  const router = useRouter();
  const { addBusiness, personalProfile, isHydrated } = useAppStore();
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    if (!personalProfile) router.replace("/onboarding");
  }, [isHydrated, personalProfile, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const biz = addBusiness({ name, bio, logoUrl: logoUrl ?? undefined });
    // TODO: replace with Supabase org insert
    router.replace(`/business/${biz.id}/menu`);
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-3 py-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Create Business</h1>
      </div>
      <p className="text-sm text-neutral-600">Set up a business profile.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <ImagePicker
          label="Logo"
          shape="circle"
          size={96}
          helperText="Recommended: square image"
          onChange={(_, url) => setLogoUrl(url)}
        />
        <Input label="Business Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        <Button type="submit" disabled={saving || !name} className="w-full">
          {saving ? "Creating…" : "Create"}
        </Button>
      </form>
    </div>
  );
}


