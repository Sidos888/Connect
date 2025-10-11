import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subline?: string;
  status?: string; // e.g., "Open" or "10 events"
  thumbnailUrl?: string;
  subListingImages?: string[]; // small preview images
};

export default function HubCard({ href, title, subline, status, thumbnailUrl, subListingImages = [] }: Props) {
  return (
    <Link
      href={href}
      className="min-w-[260px] md:min-w-[280px] snap-start rounded-2xl bg-white p-4 hover:bg-white active:bg-white transition-all duration-200"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-200">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="text-sm font-medium text-neutral-900 line-clamp-1">{title}</div>
        {subline && <div className="text-xs text-neutral-500 line-clamp-1">{subline}</div>}
        {status && <div className="text-xs text-emerald-600">{status}</div>}

        {subListingImages.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            {subListingImages.slice(0, 6).map((src, i) => (
              <div key={i} className="w-6 h-6 rounded-md overflow-hidden bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}


