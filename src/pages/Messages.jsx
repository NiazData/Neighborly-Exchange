import React, { useState, useEffect, useRef } from 'react';
import { Exchange, Message } from '@/api/entities';
import { auth } from '@/api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Messages() {
  const params = new URLSearchParams(window.location.search);
  const exchangeIdParam = params.get('exchange');
  
  const [user, setUser] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
    } catch (e) {
      auth.redirectToLogin();
    }
  };

  const ACTIVE_STATUSES = ['accepted', 'in_progress', 'pending'];

  const { data: exchanges = [], isLoading: exchangesLoading } = useQuery({
    queryKey: ['messageExchanges', user?.id],
    queryFn: async () => {
      const asProvider = await Exchange.filter({ provider_id: user.id }, '-updated_date');
      const asRequester = await Exchange.filter({ requester_id: user.id }, '-updated_date');

      const all = [...asProvider, ...asRequester];
      const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      return unique.filter(e => ACTIVE_STATUSES.includes(e.status));
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (exchangeIdParam && exchanges.length > 0) {
      const exchange = exchanges.find(e => e.id === exchangeIdParam);
      if (exchange) setSelectedExchange(exchange);
    }
  }, [exchangeIdParam, exchanges]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedExchange?.id],
    queryFn: () => Message.filter(
      { exchange_id: selectedExchange.id },
      'created_date'
    ),
    enabled: !!selectedExchange?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read
    if (selectedExchange && user && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.receiver_id === user.id && !m.read);
      unreadMessages.forEach(async (msg) => {
        await Message.update(msg.id, { read: true });
      });
    }
  }, [messages, selectedExchange, user]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const isProvider = selectedExchange.provider_id === user.id;
      const receiverId = isProvider ? selectedExchange.requester_id : selectedExchange.provider_id;
      
      return Message.create({
        exchange_id: selectedExchange.id,
        sender_id: user.id,
        sender_name: user.full_name,
        receiver_id: receiverId,
        content: newMessage,
        read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedExchange?.id]);
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate();
  };

  const getOtherParty = (exchange) => {
    if (!user) return { name: '', id: '' };
    const isProvider = exchange.provider_id === user.id;
    return {
      name: isProvider ? exchange.requester_name : exchange.provider_name,
      id: isProvider ? exchange.requester_id : exchange.provider_id,
    };
  };

  const filteredExchanges = exchanges.filter(e => {
    const other = getOtherParty(e);
    return other.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           e.skill_title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600">Chat with your exchange partners</p>
        </div>

        <Card className="overflow-hidden border-slate-100 shadow-lg">
          <div className="flex h-[70vh]">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${
              selectedExchange ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {exchangesLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                          <div className="h-3 bg-slate-100 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredExchanges.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredExchanges.map((exchange) => {
                      const other = getOtherParty(exchange);
                      return (
                        <button
                          key={exchange.id}
                          onClick={() => setSelectedExchange(exchange)}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                            selectedExchange?.id === exchange.id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                {other.name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-800 truncate">
                                  {other.name}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 truncate">
                                {exchange.skill_title}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start by requesting or accepting a skill exchange</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${
              selectedExchange ? 'flex' : 'hidden md:flex'
            }`}>
              {selectedExchange ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedExchange(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {getOtherParty(selectedExchange).name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-slate-800">
                        {getOtherParty(selectedExchange).name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedExchange.skill_title}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message, index) => {
                          const isMine = message.sender_id === user.id;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] ${
                                isMine 
                                  ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
                                  : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
                              } px-4 py-3`}>
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isMine ? 'text-emerald-200' : 'text-slate-400'
                                }`}>
                                  {format(new Date(message.created_date), 'h:mm a')}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={handleSend} className="p-4 border-t border-slate-100">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-600">Select a conversation</p>
                    <p className="text-sm">Choose from your exchanges to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}