import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Eye, Pause, Play, HandHeart, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SkillCard from '../components/skills/SkillCard';
import SkillForm from '../components/skills/SkillForm';

export default function MySkills() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
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

  const { data: mySkills = [], isLoading } = useQuery({
    queryKey: ['mySkills', user?.id],
    queryFn: () => base44.entities.Skill.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Skill.create({
      ...data,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
      location: user.location,
      is_verified_user: user.is_verified || false,
      status: 'active',
      views: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySkills']);
      toast.success('Skill posted successfully!');
      setShowForm(false);
      setFormLoading(false);
    },
    onError: () => {
      toast.error('Failed to post skill');
      setFormLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Skill.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySkills']);
      toast.success('Skill updated!');
      setShowForm(false);
      setEditingSkill(null);
      setFormLoading(false);
    },
    onError: () => {
      toast.error('Failed to update skill');
      setFormLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Skill.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySkills']);
      toast.success('Skill deleted');
      setDeleteConfirm(null);
    }
  });

  const handleSubmit = async (data) => {
    setFormLoading(true);
    if (editingSkill) {
      updateMutation.mutate({ id: editingSkill.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleStatus = async (skill) => {
    const newStatus = skill.status === 'active' ? 'paused' : 'active';
    await base44.entities.Skill.update(skill.id, { status: newStatus });
    queryClient.invalidateQueries(['mySkills']);
    toast.success(`Skill ${newStatus === 'active' ? 'activated' : 'paused'}`);
  };

  const offeringSkills = mySkills.filter(s => s.type === 'offering');
  const requestingSkills = mySkills.filter(s => s.type === 'requesting');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              My Skills
            </h1>
            <p className="text-lg text-slate-600">
              Manage your skill offerings and requests
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingSkill(null);
              setShowForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Skill
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg px-6">
              All ({mySkills.length})
            </TabsTrigger>
            <TabsTrigger value="offering" className="rounded-lg px-6">
              <HandHeart className="w-4 h-4 mr-2" />
              Offering ({offeringSkills.length})
            </TabsTrigger>
            <TabsTrigger value="requesting" className="rounded-lg px-6">
              <Search className="w-4 h-4 mr-2" />
              Requesting ({requestingSkills.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <SkillsLoading />
            ) : mySkills.length > 0 ? (
              <SkillsGrid 
                skills={mySkills} 
                onEdit={(skill) => {
                  setEditingSkill(skill);
                  setShowForm(true);
                }}
                onDelete={setDeleteConfirm}
                onToggleStatus={toggleStatus}
              />
            ) : (
              <EmptyState onAdd={() => setShowForm(true)} />
            )}
          </TabsContent>

          <TabsContent value="offering" className="mt-6">
            {offeringSkills.length > 0 ? (
              <SkillsGrid 
                skills={offeringSkills} 
                onEdit={(skill) => {
                  setEditingSkill(skill);
                  setShowForm(true);
                }}
                onDelete={setDeleteConfirm}
                onToggleStatus={toggleStatus}
              />
            ) : (
              <EmptyState type="offering" onAdd={() => setShowForm(true)} />
            )}
          </TabsContent>

          <TabsContent value="requesting" className="mt-6">
            {requestingSkills.length > 0 ? (
              <SkillsGrid 
                skills={requestingSkills} 
                onEdit={(skill) => {
                  setEditingSkill(skill);
                  setShowForm(true);
                }}
                onDelete={setDeleteConfirm}
                onToggleStatus={toggleStatus}
              />
            ) : (
              <EmptyState type="requesting" onAdd={() => setShowForm(true)} />
            )}
          </TabsContent>
        </Tabs>

        {/* Skill Form Modal */}
        <SkillForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSkill(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingSkill}
          loading={formLoading}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your skill posting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function SkillsGrid({ skills, onEdit, onDelete, onToggleStatus }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="relative group overflow-hidden border-slate-100 hover:shadow-lg transition-shadow">
            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              skill.status === 'active' 
                ? skill.type === 'offering' 
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-slate-300'
            }`} />

            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className={`mb-2 ${
                    skill.type === 'offering' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                  </Badge>
                  {skill.status === 'paused' && (
                    <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                      Paused
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye className="w-3.5 h-3.5" />
                  {skill.views || 0}
                </div>
              </div>

              <h3 className="font-semibold text-lg text-slate-800 mb-2 line-clamp-2">
                {skill.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                {skill.description}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onEdit(skill)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onToggleStatus(skill)}
                >
                  {skill.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(skill)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function SkillsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-6 bg-slate-200 rounded w-20 mb-4" />
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-full mb-4" />
            <div className="h-10 bg-slate-100 rounded mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ type, onAdd }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
        {type === 'offering' ? (
          <HandHeart className="w-10 h-10 text-emerald-400" />
        ) : type === 'requesting' ? (
          <Search className="w-10 h-10 text-amber-400" />
        ) : (
          <Plus className="w-10 h-10 text-slate-400" />
        )}
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        {type === 'offering' 
          ? "You haven't posted any skills to offer yet"
          : type === 'requesting'
          ? "You haven't requested any help yet"
          : "No skills posted yet"
        }
      </h3>
      <p className="text-slate-500 mb-6">
        {type === 'offering'
          ? "Share what you can do to help your neighbors"
          : type === 'requesting'
          ? "Let your neighbors know what help you need"
          : "Start by posting a skill you can offer or request"
        }
      </p>
      <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
        <Plus className="w-4 h-4 mr-2" />
        Post Your First Skill
      </Button>
    </div>
  );
}