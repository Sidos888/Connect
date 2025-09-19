"use client";

import Button from "@/components/Button";
import { CalendarIcon, PlusIcon } from "@/components/icons";

type Props = {
  onCreate?: () => void;
  onCalendar?: () => void;
};

export default function QuickActions({ onCreate, onCalendar }: Props) {
  return (
    <div className="flex justify-center gap-2">
      <Button variant="secondary" className="justify-self-center w-32 md:w-40 rounded-2xl py-3 shadow-sm border border-neutral-200 bg-white text-neutral-900 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2" onClick={onCalendar}>
        <CalendarIcon width={18} height={18} />
        <span className="text-base font-semibold">Calendar</span>
      </Button>
      <Button variant="secondary" className="justify-self-center w-32 md:w-40 rounded-2xl py-3 shadow-sm border border-neutral-200 bg-white text-neutral-900 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2" onClick={onCreate}>
        <PlusIcon width={18} height={18} />
        <span className="text-base font-semibold">Create</span>
      </Button>
    </div>
  );
}


