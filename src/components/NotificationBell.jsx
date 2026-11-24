import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NotificationBell({ userId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => Notification.filter({ user_id: userId }, '-created_date', 20),
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });

  React.useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSelect = (notification) => {
    if (!notification.read) markReadMutation.mutate(notification.id);
    if (notification.exchange_id) {
      navigate(`${createPageUrl('Messages')}?exchange=${notification.exchange_id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleSelect(n)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                !n.read ? 'bg-emerald-50/60' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                <div className={!n.read ? '' : 'pl-4'}>
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
