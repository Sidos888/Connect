import Link from "next/link";

type Props = {
  href?: string;
  title: string;
  subtitle: string;
  thumbnailUrl?: string;
  rightChip?: string;
};

export default function ListingRow({ href = "#", title, subtitle, thumbnailUrl, rightChip }: Props) {
  return (
    <Link href={href} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 flex items-center gap-4 shadow-sm">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-200 flex items-center justify-center">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">📷</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-neutral-900 truncate">{title}</div>
        <div className="text-sm text-neutral-500 truncate">{subtitle}</div>
      </div>
      {rightChip && (
        <span className="text-xs px-2 py-1 rounded-full border border-neutral-300 whitespace-nowrap">{rightChip}</span>
      )}
    </Link>
  );
}


