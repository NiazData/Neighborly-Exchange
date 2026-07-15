import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VerificationRequest } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Shield, CheckCircle, Circle, Clock, XCircle,
  Loader2, Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import Seo from '@/components/Seo';

export default function Verification() {
  const { user, isLoadingAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ['verificationRequest', user?.id],
    queryFn: async () => {
      const requests = await VerificationRequest.filter(
        { user_id: user.id },
        '-created_date',
        1
      );
      return requests[0];
    },
    enabled: !!user?.id,
  });

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user.is_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-emerald-200 bg-emerald-50 text-center">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-800 mb-2">You're Verified!</h2>
                <p className="text-emerald-700">
                  You now have access to all platform features and increased trust from the community.
                </p>
                <Badge className="mt-6 bg-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified Member
                </Badge>
                <p className="text-xs text-emerald-700/80 mt-6">
                  Verified means this member confirmed their email and completed their profile — it is not an identity check.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (existingRequest?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-200 bg-amber-50 text-center">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-6">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-amber-800 mb-2">Verification Pending</h2>
                <p className="text-amber-700">
                  Your verification request is being reviewed. We'll notify you once it's complete.
                </p>
                <Badge className="mt-6 bg-amber-600">
                  <Clock className="w-4 h-4 mr-1" />
                  Under Review
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const checks = [
    { label: 'Email confirmed', done: true },
    { label: 'Profile photo added', done: Boolean(user?.avatar_url) },
    { label: 'Bio written (20+ characters)', done: (user?.bio || '').length >= 20 },
    { label: 'Neighborhood set', done: Boolean(user?.location?.city || user?.location?.lat) },
  ];
  const complete = checks.every((c) => c.done);
  const phoneFlagOn = import.meta.env.VITE_PHONE_VERIFICATION === 'on';

  const handleSubmit = async () => {
    if (!complete) return;
    setSubmitting(true);
    try {
      await VerificationRequest.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        kind: 'profile',
        status: 'pending',
      });
      toast.success('Verification request submitted!');
      await refetch();
    } catch (e) {
      toast.error('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo title="Verification" noindex />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Get Verified</h1>
            <p className="text-slate-600">
              Complete your profile to earn the verified badge and build trust with neighbors
            </p>
          </div>

          {existingRequest?.status === 'rejected' && (
            <Card className="border-red-200 bg-red-50 text-center mb-8">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Verification Rejected</h2>
                <p className="text-red-700 mb-4">
                  Your previous verification request was not approved.
                </p>
                {existingRequest.rejection_reason && (
                  <div className="bg-white rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-red-800">Reason:</p>
                    <p className="text-sm text-red-700">{existingRequest.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          <Card className="border-slate-100 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Profile Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {checks.map((check) => (
                  <li key={check.label} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {check.done ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-sm ${check.done ? 'text-slate-700' : 'text-slate-500'}`}>
                        {check.label}
                      </span>
                    </div>
                    {!check.done && (
                      <Link
                        to={createPageUrl('Profile')}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 shrink-0"
                      >
                        Update
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {phoneFlagOn && (
            <Card className="border-slate-100 mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  Verify Phone Number
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="phone-number">Phone number</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-slate-500">SMS verification arriving soon.</p>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Card className="border-slate-100">
            <CardContent className="p-6 space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={!complete || submitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
              {!complete && (
                <p className="text-sm text-center text-slate-500">
                  Complete every item above to submit for verification.
                </p>
              )}
              <p className="text-xs text-center text-slate-500">
                Verified means this member confirmed their email and completed their profile — it is not an identity check.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
