import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scale, Building, FileText, AlertCircle, Globe, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Legal Notice</h1>
            <p className="text-slate-600">Important legal information about NeighborSkill</p>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Building className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Company Information</h2>
                      <div className="space-y-2 text-slate-600">
                        <p><strong>Company Name:</strong> NeighborSkill, Inc.</p>
                        <p><strong>Legal Form:</strong> Delaware Corporation</p>
                        <p><strong>Address:</strong> 123 Community Lane, Suite 100, San Francisco, CA 94105</p>
                        <p><strong>Email:</strong> legal@neighborskill.com</p>
                        <p><strong>Registration Number:</strong> DE-12345678</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Platform Description</h2>
                      <p className="text-slate-600 leading-relaxed">
                        NeighborSkill is a community-based platform that facilitates skill exchanges between neighbors. The platform operates on a barter system and does not process monetary transactions. We provide the technology infrastructure to connect users but are not a party to any exchange agreements between users.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Disclaimer</h2>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        NeighborSkill does not guarantee, endorse, or verify the quality, safety, legality, or suitability of any skills, services, or users on the platform. Users engage in skill exchanges at their own risk and discretion.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        While we provide identity verification services, these do not constitute a guarantee of user trustworthiness or the quality of services exchanged. Users should exercise appropriate caution and judgment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Intellectual Property</h2>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        All content, trademarks, logos, and intellectual property on this platform are owned by NeighborSkill, Inc. or its licensors. Users may not reproduce, distribute, or create derivative works without explicit permission.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        User-generated content remains the property of the respective users, who grant NeighborSkill a non-exclusive license to display such content on the platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Gavel className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Governing Law & Jurisdiction</h2>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        These terms and any disputes arising from the use of NeighborSkill shall be governed by the laws of the State of California, United States, without regard to conflict of law principles.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        Any legal proceedings shall be brought exclusively in the federal or state courts located in San Francisco County, California. Users consent to the personal jurisdiction of these courts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-3">Dispute Resolution</h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    We encourage users to resolve disputes directly with each other. For unresolved issues, please contact our support team at disputes@neighborskill.com.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    For disputes that cannot be resolved informally, parties agree to attempt mediation before pursuing arbitration or litigation. Arbitration shall be conducted under the rules of the American Arbitration Association.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-amber-800 mb-3">Important Notice</h2>
                  <p className="text-amber-700 leading-relaxed">
                    This legal notice is provided for informational purposes. For specific legal advice, please consult with a qualified attorney. NeighborSkill reserves the right to update this notice at any time.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}