import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Suspended() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <ShieldAlert className="h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-bold">Account suspended</h1>
      <p className="max-w-md text-slate-500">
        Your account has been suspended by a moderator for violating the
        community guidelines. If you believe this is a mistake, contact support.
      </p>
      <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
    </div>
  );
}
