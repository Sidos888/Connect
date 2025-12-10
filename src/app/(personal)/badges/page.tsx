"use client";

import { useRouter } from "next/navigation";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import Badges from "@/components/badges/Badges";

export default function BadgesPage() {
  const router = useRouter();

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Badges"
          backButton
          onBack={() => router.replace('/menu?view=profile')}
        />
        <PageContent>
          <Badges />
        </PageContent>
      </MobilePage>
    </div>
  );
}


