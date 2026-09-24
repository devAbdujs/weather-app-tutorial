import { getServerSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/marketing/LandingPage';

export default async function HomePage() {
  const session = await getServerSession();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return <LandingPage />;
}
