import AddLinkForm from "@/components/links/AddLinkForm";

// Generate static params for all link types
export async function generateStaticParams() {
  return [
    { linkType: 'email' },
    { linkType: 'phone' },
    { linkType: 'instagram' },
    { linkType: 'whatsapp' },
    { linkType: 'website' },
    { linkType: 'snapchat' },
    { linkType: 'x' },
    { linkType: 'facebook' },
    { linkType: 'linkedin' },
    { linkType: 'other' },
  ];
}

export default function AddLinkFormPage({ params }: { params: { linkType: string } }) {
  return <AddLinkForm linkType={params.linkType} />;
}
