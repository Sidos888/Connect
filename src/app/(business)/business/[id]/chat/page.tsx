import ChatPage from './ChatPage';

export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

export default function Page() {
  return <ChatPage />;
}


