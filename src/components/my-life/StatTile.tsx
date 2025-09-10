type Props = {
  title: string;
  value: string;
};

export default function StatTile({ title, value }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white p-4">
      <div className="text-base font-medium text-neutral-900">{title}</div>
      <div className="text-sm text-neutral-500 mt-6">{value}</div>
    </div>
  );
}


