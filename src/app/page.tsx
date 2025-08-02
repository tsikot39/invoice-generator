import { redirect } from 'next/navigation';

// Use a simple redirect without session checking to avoid JWT errors
export default function HomePage() {
  // Let the middleware handle the authentication logic
  redirect('/auth/signin');
}
