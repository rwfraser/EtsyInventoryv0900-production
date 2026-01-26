'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PromoteUserButtonProps {
  userId: string;
  userEmail: string;
}

export default function PromoteUserButton({ userId, userEmail }: PromoteUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePromote = async () => {
    if (!confirm(`Are you sure you want to promote ${userEmail} to administrator?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully promoted ${userEmail} to administrator`);
        router.refresh();
      } else {
        alert(data.error || 'Failed to promote user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePromote}
      disabled={isLoading}
      className="text-purple-600 hover:text-purple-900 font-medium disabled:opacity-50"
    >
      {isLoading ? 'Promoting...' : 'Promote to Admin'}
    </button>
  );
}
