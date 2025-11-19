"use client";

interface ListingHeaderProps {
  title: string;
  date: string | null;
  summary?: string | null;
}

export default function ListingHeader({ title, date, summary }: ListingHeaderProps) {
  // Format date as "January 15th • 10:15am"
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date TBD';
    try {
      const date = new Date(dateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const month = months[date.getMonth()];
      const day = date.getDate();
      
      // Add ordinal suffix
      const getOrdinal = (n: number) => {
        if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
        if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
        if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
        return n + 'th';
      };
      
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      
      return `${month} ${getOrdinal(day)} • ${hours}:${minutesStr}${ampm}`;
    } catch {
      return 'Date TBD';
    }
  };

  return (
    <>
      {/* Title and Date */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {date && (
          <p className="text-base font-normal text-gray-500">
            {formatDate(date)}
          </p>
        )}
      </div>

      {/* Summary - only show if summary exists */}
      {summary && summary.trim() && (
        <div className="mb-6 text-center">
          <p className="text-base font-normal text-gray-400">
            {summary}
          </p>
        </div>
      )}
    </>
  );
}

