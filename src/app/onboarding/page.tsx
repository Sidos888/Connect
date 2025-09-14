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

  // Prevent body scrolling on onboarding page
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    console.log('Onboarding form submitted:', { name, bio, avatarUrl });
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
      console.log('Profile set, redirecting to home');
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
        <Input 
          label="Name" 
          value={name} 
          onChange={(e) => {
            console.log('Name input changed:', e.target.value);
            setName(e.target.value);
          }} 
          required 
        />
        <div>
          <div className="relative">
            <TextArea 
              label="Bio" 
              value={bio} 
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 150) {
                  setBio(value);
                }
              }} 
              rows={4} 
              maxLength={150}
              className="pr-16"
            />
            {/* Character counter inside the textarea */}
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <span className={`text-xs font-medium ${bio.length > 135 ? 'text-orange-600' : 'text-gray-500'}`}>
                {bio.length}/150
              </span>
            </div>
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={saving || !name} 
          className="w-full touch-manipulation"
          onClick={(e) => {
            console.log('Continue button clicked:', { name, saving, disabled: saving || !name });
            // Fallback: if form submission doesn't work, handle it manually
            if (!name || saving) {
              console.log('Button disabled, not proceeding');
              return;
            }
            // Prevent double submission
            if (saving) return;
            console.log('Manual form submission triggered');
            handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
          }}
          style={{ touchAction: 'manipulation' }}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}


