import MyBusinessPage from './MyBusinessPage';

export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

export default function Page() {
  return <MyBusinessPage />;
}