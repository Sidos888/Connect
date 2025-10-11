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
    <Link 
      href={href} 
      className="rounded-2xl bg-white px-4 py-4 flex items-center gap-4 hover:bg-white transition-all duration-200"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
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


