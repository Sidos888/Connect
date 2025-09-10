import MenuPage from './MenuPage';

export async function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'example' }
  ];
}

export default function Page() {
  return <MenuPage />;
}


