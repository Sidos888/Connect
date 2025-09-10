import ChatDetailPage from './ChatDetailPage';

export async function generateStaticParams() {
  return [
    { id: 'demo', chatId: 'chat1' },
    { id: 'demo', chatId: 'chat2' },
    { id: 'example', chatId: 'chat1' },
    { id: 'example', chatId: 'chat2' }
  ];
}

export default function Page() {
  return <ChatDetailPage />;
}