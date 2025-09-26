export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

import MobileTitle from "@/components/MobileTitle";

export default function Page() {
  const categories: { title: string; icon: string }[] = [
    { title: "Personal Help", icon: "🧑‍🔧" },
    { title: "Creative & Skilled Pros", icon: "🎨" },
    { title: "Local Services", icon: "🛠️" },
    { title: "Venue Hire", icon: "🏠" },
    { title: "Food & Drink", icon: "🍽️" },
    { title: "Rentals", icon: "🎪" },
    { title: "Open invitations", icon: "📨" },
  ];

  return (
    <div>
      <MobileTitle title="Explore" />
      <div className="space-y-5 px-4 lg:px-0 pt-[120px] lg:pt-0">
        <h1 className="hidden lg:block text-3xl font-bold">Explore</h1>

      <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-neutral-900">
            <span className="text-lg">📍</span>
            <span className="font-semibold">Adelaide</span>
          </div>
          <div className="text-sm text-neutral-500">Date/Time</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.slice(0, 6).map((c) => (
          <button key={c.title} className="rounded-2xl border border-neutral-200 shadow-sm bg-white h-28 lg:h-32 xl:h-36 px-4 text-center hover:bg-neutral-50 flex flex-col items-center justify-center gap-2">
            <div className="text-3xl lg:text-4xl" aria-hidden>{c.icon}</div>
            <div className="text-sm lg:text-base font-medium text-neutral-900">{c.title}</div>
          </button>
        ))}
      </div>

      <div>
        <button className="w-full rounded-2xl border border-neutral-200 shadow-sm bg-white h-28 md:h-32 lg:h-36 px-4 text-center flex flex-col items-center justify-center gap-1">
          <div className="text-base font-medium text-neutral-900">Open invitations</div>
          <div className="text-sm text-neutral-400">Coming Soon</div>
        </button>
      </div>
      </div>
    </div>
  );
}


