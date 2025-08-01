import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-helper';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/auth/signin');
  }
}
