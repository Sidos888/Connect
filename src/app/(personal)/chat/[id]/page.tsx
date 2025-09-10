import PersonalChatPage from './PersonalChatPage';

export async function generateStaticParams() {
  // Return empty array since we're using dynamic routing
  return [];
}

export default function Page() {
  return <PersonalChatPage />;
}