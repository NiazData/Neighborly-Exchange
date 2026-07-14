import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Clock, CheckCircle, XCircle, AlertTriangle, 
  MessageSquare, ArrowRightLeft, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: { 
    color: 'bg-amber-100 text-amber-700', 
    icon: Clock,
    label: 'Pending'
  },
  accepted: { 
    color: 'bg-blue-100 text-blue-700', 
    icon: CheckCircle,
    label: 'Accepted'
  },
  in_progress: { 
    color: 'bg-purple-100 text-purple-700', 
    icon: ArrowRightLeft,
    label: 'In Progress'
  },
  completed: { 
    color: 'bg-emerald-100 text-emerald-700', 
    icon: CheckCircle,
    label: 'Completed'
  },
  cancelled: { 
    color: 'bg-slate-100 text-slate-700', 
    icon: XCircle,
    label: 'Cancelled'
  },
  disputed: { 
    color: 'bg-red-100 text-red-700', 
    icon: AlertTriangle,
    label: 'Disputed'
  },
};

export default function ExchangeCard({ 
  exchange, 
  currentUserId, 
  onAccept, 
  onDecline, 
  onComplete,
  onMessage,
  index = 0 
}) {
  const status = statusConfig[exchange.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isProvider = exchange.provider_id === currentUserId;
  const otherPartyName = isProvider ? exchange.requester_name : exchange.provider_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-slate-100">
        <CardContent className="p-0">
          {/* Status Bar */}
          <div className={`px-4 py-2 ${status.color.split(' ')[0]} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${status.color.split(' ')[1]}`} />
              <span className={`text-sm font-medium ${status.color.split(' ')[1]}`}>
                {status.label}
              </span>
            </div>
            {exchange.scheduled_date && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(exchange.scheduled_date), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Skill Title */}
            <h3 className="font-semibold text-lg text-slate-800 mb-3">
              {exchange.skill_title}
            </h3>

            {/* Other Party */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {otherPartyName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-500">
                  {isProvider ? 'Requested by' : 'Offered by'}
                </p>
                <p className="font-medium text-slate-700">{otherPartyName}</p>
              </div>
            </div>

            {/* Exchange Offer */}
            {exchange.exchange_offer && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">In exchange for:</p>
                <p className="text-sm text-slate-700 bg-amber-50 px-3 py-2 rounded-lg">
                  {exchange.exchange_offer}
                </p>
              </div>
            )}

            {/* Message */}
            {exchange.message && (
              <p className="text-sm text-slate-600 mb-4 italic">
                "{exchange.message}"
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {exchange.status === 'pending' && isProvider && (
                <>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onAccept(exchange)}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onDecline(exchange)}
                  >
                    Decline
                  </Button>
                </>
              )}
              
              {(exchange.status === 'accepted' || exchange.status === 'in_progress') && (
                <>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => onMessage(exchange)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onComplete(exchange)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </>
              )}

              {exchange.status === 'completed' && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Exchange Completed
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}