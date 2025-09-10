import PersonalChatPage from './PersonalChatPage';

export async function generateStaticParams() {
  // Return sample chat IDs for static generation
  return [
    { id: 'chat1' },
    { id: 'chat2' },
    { id: 'chat3' }
  ];
}

export default function Page() {
  return <PersonalChatPage />;
}