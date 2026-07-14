import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, ArrowRightLeft, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ExchangeCard from '../components/exchange/ExchangeCard';
import ReviewForm from '../components/reviews/ReviewForm';

export default function Exchanges() {
  const [user, setUser] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: exchanges = [], isLoading } = useQuery({
    queryKey: ['exchanges', user?.id],
    queryFn: async () => {
      const asProvider = await base44.entities.Exchange.filter({ provider_id: user.id }, '-created_date');
      const asRequester = await base44.entities.Exchange.filter({ requester_id: user.id }, '-created_date');
      
      // Combine and deduplicate
      const all = [...asProvider, ...asRequester];
      const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      return unique.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Exchange.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchanges']);
    }
  });

  const handleAccept = async (exchange) => {
    await updateMutation.mutateAsync({ id: exchange.id, data: { status: 'accepted' } });
    toast.success('Exchange accepted!');
  };

  const handleDecline = async (exchange) => {
    await updateMutation.mutateAsync({ id: exchange.id, data: { status: 'cancelled' } });
    toast.success('Exchange declined');
  };

  const handleComplete = async (exchange) => {
    await updateMutation.mutateAsync({ 
      id: exchange.id, 
      data: { 
        status: 'completed',
        completed_date: new Date().toISOString()
      } 
    });
    
    // Update user stats
    if (user) {
      await base44.auth.updateMe({
        total_exchanges: (user.total_exchanges || 0) + 1
      });
    }
    
    toast.success('Exchange marked as complete!');
    setSelectedExchange(exchange);
    setShowReviewForm(true);
  };

  const handleMessage = (exchange) => {
    window.location.href = `/Messages?exchange=${exchange.id}`;
  };

  const handleSubmitReview = async (reviewData) => {
    setReviewLoading(true);
    
    const isProvider = selectedExchange.provider_id === user.id;
    const revieweeId = isProvider ? selectedExchange.requester_id : selectedExchange.provider_id;
    const revieweeName = isProvider ? selectedExchange.requester_name : selectedExchange.provider_name;
    
    await base44.entities.Review.create({
      exchange_id: selectedExchange.id,
      reviewer_id: user.id,
      reviewer_name: user.full_name,
      reviewee_id: revieweeId,
      ...reviewData
    });

    // Update reviewee stats
    const reviews = await base44.entities.Review.filter({ reviewee_id: revieweeId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    // Note: Can't update other user's data directly, would need backend function
    
    toast.success('Review submitted!');
    setShowReviewForm(false);
    setSelectedExchange(null);
    setReviewLoading(false);
  };

  const pendingExchanges = exchanges.filter(e => e.status === 'pending');
  const activeExchanges = exchanges.filter(e => ['accepted', 'in_progress'].includes(e.status));
  const completedExchanges = exchanges.filter(e => e.status === 'completed');
  const cancelledExchanges = exchanges.filter(e => ['cancelled', 'disputed'].includes(e.status));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            My Exchanges
          </h1>
          <p className="text-lg text-slate-600">
            Track your skill exchanges and requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-100">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold text-slate-900">{pendingExchanges.length}</div>
              <div className="text-sm text-slate-500">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="p-4 text-center">
              <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-slate-900">{activeExchanges.length}</div>
              <div className="text-sm text-slate-500">Active</div>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold text-slate-900">{completedExchanges.length}</div>
              <div className="text-sm text-slate-500">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-slate-100">
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <div className="text-2xl font-bold text-slate-900">{cancelledExchanges.length}</div>
              <div className="text-sm text-slate-500">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-6">
            <TabsTrigger value="pending" className="rounded-lg px-4">
              Pending
              {pendingExchanges.length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{pendingExchanges.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg px-4">
              Active
              {activeExchanges.length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-700">{activeExchanges.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-4">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg px-4">
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <LoadingCards />
            ) : pendingExchanges.length > 0 ? (
              <div className="grid gap-4">
                {pendingExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    currentUserId={user.id}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onComplete={handleComplete}
                    onMessage={handleMessage}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="pending" />
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeExchanges.length > 0 ? (
              <div className="grid gap-4">
                {activeExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    currentUserId={user.id}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onComplete={handleComplete}
                    onMessage={handleMessage}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="active" />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedExchanges.length > 0 ? (
              <div className="grid gap-4">
                {completedExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    currentUserId={user.id}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onComplete={handleComplete}
                    onMessage={handleMessage}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="completed" />
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledExchanges.length > 0 ? (
              <div className="grid gap-4">
                {cancelledExchanges.map((exchange, index) => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    currentUserId={user.id}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onComplete={handleComplete}
                    onMessage={handleMessage}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="cancelled" />
            )}
          </TabsContent>
        </Tabs>

        {/* Review Form */}
        <ReviewForm
          open={showReviewForm}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedExchange(null);
          }}
          onSubmit={handleSubmitReview}
          exchangeTitle={selectedExchange?.skill_title}
          revieweeName={
            selectedExchange?.provider_id === user?.id 
              ? selectedExchange?.requester_name 
              : selectedExchange?.provider_name
          }
          loading={reviewLoading}
        />
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 bg-slate-200 rounded w-20 mb-4" />
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
            <div className="h-16 bg-slate-100 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ type }) {
  const messages = {
    pending: {
      icon: Clock,
      title: 'No pending exchanges',
      description: 'When someone requests your skill or you request theirs, it will appear here.'
    },
    active: {
      icon: ArrowRightLeft,
      title: 'No active exchanges',
      description: 'Accepted exchanges that are in progress will appear here.'
    },
    completed: {
      icon: CheckCircle,
      title: 'No completed exchanges yet',
      description: 'Your successful exchanges will be shown here.'
    },
    cancelled: {
      icon: XCircle,
      title: 'No cancelled exchanges',
      description: 'Declined or cancelled exchanges will appear here.'
    }
  };

  const { icon: Icon, title, description } = messages[type];

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500">{description}</p>
    </div>
  );
}