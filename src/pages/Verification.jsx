import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, Upload, CheckCircle, Clock, XCircle, 
  Camera, FileText, AlertTriangle, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Verification() {
  const [user, setUser] = useState(null);
  const [idType, setIdType] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const { data: existingRequest } = useQuery({
    queryKey: ['verificationRequest', user?.id],
    queryFn: async () => {
      const requests = await base44.entities.VerificationRequest.filter(
        { user_id: user.id },
        '-created_date',
        1
      );
      return requests[0];
    },
    enabled: !!user?.id,
  });

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIdDocument(file_url);
    setUploading(false);
    toast.success('ID document uploaded');
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSelfie(file_url);
    setUploading(false);
    toast.success('Selfie uploaded');
  };

  const handleSubmit = async () => {
    if (!idType || !idDocument || !selfie) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    await base44.entities.VerificationRequest.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      id_type: idType,
      id_document_url: idDocument,
      selfie_url: selfie,
      status: 'pending',
    });

    toast.success('Verification request submitted!');
    setSubmitting(false);
    window.location.reload();
  };

  if (!user) {
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
                  Your identity has been verified. You now have access to all platform features and increased trust from the community.
                </p>
                <Badge className="mt-6 bg-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified Member
                </Badge>
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
                  Your verification request is being reviewed. This usually takes 1-2 business days. We'll notify you once it's complete.
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

  if (existingRequest?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50 text-center mb-8">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">Verification Rejected</h2>
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
            <VerificationForm 
              idType={idType} setIdType={setIdType}
              idDocument={idDocument} handleIdUpload={handleIdUpload}
              selfie={selfie} handleSelfieUpload={handleSelfieUpload}
              uploading={uploading} submitting={submitting}
              handleSubmit={handleSubmit}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Identity Verification</h1>
            <p className="text-slate-600">
              Get verified to build trust and access more features
            </p>
          </div>

          {/* Benefits */}
          <Card className="border-slate-100 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Why Get Verified?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, text: 'Verified badge on your profile' },
                  { icon: Shield, text: 'Higher trust from neighbors' },
                  { icon: AlertTriangle, text: 'Priority in search results' },
                  { icon: FileText, text: 'Access to premium features' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <VerificationForm 
            idType={idType} setIdType={setIdType}
            idDocument={idDocument} handleIdUpload={handleIdUpload}
            selfie={selfie} handleSelfieUpload={handleSelfieUpload}
            uploading={uploading} submitting={submitting}
            handleSubmit={handleSubmit}
          />
        </motion.div>
      </div>
    </div>
  );
}

function VerificationForm({ 
  idType, setIdType, 
  idDocument, handleIdUpload, 
  selfie, handleSelfieUpload,
  uploading, submitting,
  handleSubmit 
}) {
  return (
    <Card className="border-slate-100">
      <CardHeader>
        <CardTitle>Submit Verification Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ID Type */}
        <div>
          <Label>ID Document Type</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="national_id">National ID Card</SelectItem>
              <SelectItem value="other">Other Government ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Document Upload */}
        <div>
          <Label>Upload ID Document</Label>
          <p className="text-sm text-slate-500 mb-2">
            Upload a clear photo of your government-issued ID
          </p>
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            idDocument 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            {idDocument ? (
              <div className="text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">Document Uploaded</p>
                <p className="text-xs text-emerald-600">Click to replace</p>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">Click to upload ID</p>
                <p className="text-xs text-slate-400">PNG, JPG or PDF</p>
              </div>
            )}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
          </label>
        </div>

        {/* Selfie Upload */}
        <div>
          <Label>Upload a Selfie</Label>
          <p className="text-sm text-slate-500 mb-2">
            Take a clear photo of yourself holding your ID
          </p>
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            selfie 
              ? 'border-emerald-300 bg-emerald-50' 
              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            {selfie ? (
              <div className="text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">Selfie Uploaded</p>
                <p className="text-xs text-emerald-600">Click to replace</p>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">Click to upload selfie</p>
                <p className="text-xs text-slate-400">PNG or JPG</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
          </label>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">Privacy Notice</p>
          <p>
            Your documents are encrypted and stored securely. They will only be used for verification purposes and will be deleted after review.
          </p>
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit}
          disabled={uploading || submitting || !idType || !idDocument || !selfie}
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
      </CardContent>
    </Card>
  );
}