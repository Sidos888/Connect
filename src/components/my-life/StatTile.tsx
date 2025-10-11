type Props = {
  title: string;
  value: string;
};

export default function StatTile({ title, value }: Props) {
  return (
    <div 
      className="rounded-2xl bg-white p-4"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="text-base font-medium text-neutral-900">{title}</div>
      <div className="text-sm text-neutral-500 mt-6">{value}</div>
    </div>
  );
}


