"use client";

interface ListingHeaderProps {
  title: string;
  date: string | null;
  endDate?: string | null;
  summary?: string | null;
}

export default function ListingHeader({ title, date, endDate, summary }: ListingHeaderProps) {
  // Format date as "December 1st • 5:10pm-5:20pm"
  const formatDate = (startDateString: string | null, endDateString?: string | null): string => {
    if (!startDateString) return 'Date TBD';
    try {
      const startDate = new Date(startDateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const month = months[startDate.getMonth()];
      const day = startDate.getDate();
      
      // Add ordinal suffix
      const getOrdinal = (n: number) => {
        if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
        if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
        if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
        return n + 'th';
      };
      
      // Format start time
      let startHours = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      const startAmpm = startHours >= 12 ? 'pm' : 'am';
      startHours = startHours % 12;
      startHours = startHours ? startHours : 12;
      const startMinutesStr = startMinutes < 10 ? `0${startMinutes}` : startMinutes.toString();
      
      // If end date exists, format it too
      if (endDateString) {
        const endDate = new Date(endDateString);
        let endHours = endDate.getHours();
        const endMinutes = endDate.getMinutes();
        const endAmpm = endHours >= 12 ? 'pm' : 'am';
        endHours = endHours % 12;
        endHours = endHours ? endHours : 12;
        const endMinutesStr = endMinutes < 10 ? `0${endMinutes}` : endMinutes.toString();
        
        return `${month} ${getOrdinal(day)} • ${startHours}:${startMinutesStr}${startAmpm}-${endHours}:${endMinutesStr}${endAmpm}`;
      }
      
      // No end date - just show start time
      return `${month} ${getOrdinal(day)} • ${startHours}:${startMinutesStr}${startAmpm}`;
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
            {formatDate(date, endDate)}
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

