import AdminSettings from '@/features/settings/components/AdminSettings';
import { getAuthenticatedUser } from '@/lib/session'; // Import getAuthenticatedUser
import { redirect } from 'next/navigation'; // Import redirect

export default async function SettingsPage() { // Make the component async
  const currentUser = await getAuthenticatedUser();

  // If user is not logged in or not an admin, redirect
  if (!currentUser || currentUser.position !== 'admin') {
    redirect('/'); // Redirect to home page or an access denied page
  }

  return <AdminSettings />;
}
