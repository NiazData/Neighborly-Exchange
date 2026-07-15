import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scale, Building, FileText, AlertCircle, Globe, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo
        title="Legal Notice"
        path="/Legal"
        description="Legal information about the Neighbourly Exchange platform."
      />
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
            <p className="text-slate-600">Effective: July 2026</p>
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
                      <h2 className="text-xl font-semibold text-slate-800 mb-3">Operator Information</h2>
                      <div className="space-y-2 text-slate-600">
                        <p><strong>Operator:</strong> [PLACEHOLDER — OPERATOR NAME]</p>
                        <p><strong>Contact Email:</strong> [PLACEHOLDER — CONTACT EMAIL]</p>
                        <p><strong>Address:</strong> [PLACEHOLDER — OPERATOR NAME] does not maintain a public postal address for this platform at this time.</p>
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
                        Neighbourly Exchange is a community platform that facilitates skill exchanges between neighbors. The platform operates on a barter basis and does not process monetary transactions between members. We provide the technology to connect members but are not a party to any exchange agreement between them.
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
                        Neighbourly Exchange does not guarantee, endorse, or verify the quality, safety, legality, or suitability of any skills, services, or members. Members participate at their own discretion and risk.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        The Verified badge indicates a confirmed email and completed profile — it is not an identity or background check.
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
                        All platform content, trademarks, logos, and design elements are owned by [PLACEHOLDER — OPERATOR NAME] or its licensors. Members may not reproduce, distribute, or create derivative works without explicit permission.
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        Content you post (listings, profile text, photos, messages) remains yours. By posting it, you grant [PLACEHOLDER — OPERATOR NAME] a non-exclusive license to display it on the platform for the purpose of operating the service.
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
                      <p className="text-slate-600 leading-relaxed">
                        These terms and any disputes arising from the use of Neighbourly Exchange are governed by the laws of [PLACEHOLDER — JURISDICTION], without regard to conflict of law principles.
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
                  <p className="text-slate-600 leading-relaxed">
                    We encourage members to resolve disputes directly with each other. For issues that cannot be resolved between members, please use the in-app report system, or contact us at [PLACEHOLDER — CONTACT EMAIL].
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
                    This legal notice is provided for informational purposes only and does not constitute legal advice. For specific legal advice, please consult with a qualified attorney. Neighbourly Exchange reserves the right to update this notice at any time.
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
