import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Database, Lock, Globe, Trash2, Bell, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: `We collect information you provide directly:
• Account information (name, email, phone)
• Profile information (bio, location, photo)
• Verification documents (stored securely and deleted after review)
• Skills and exchange history
• Messages between users
• Reviews and ratings

We also automatically collect:
• Device information and IP address
• Usage data and interactions
• Location data (with your permission)`
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: `We use your information to:
• Provide and improve our services
• Match you with nearby neighbors
• Process identity verification
• Send notifications about exchanges
• Ensure platform safety and security
• Comply with legal obligations`
    },
    {
      icon: Lock,
      title: "Information Sharing",
      content: `We share your information only:
• With other users as part of the exchange process
• With service providers who assist our operations
• When required by law or legal process
• To protect rights, safety, and security

We never sell your personal information to third parties.`
    },
    {
      icon: Globe,
      title: "Your Rights (GDPR & CCPA)",
      content: `You have the right to:
• Access your personal data
• Correct inaccurate data
• Delete your data ("right to be forgotten")
• Restrict or object to processing
• Data portability
• Opt-out of sale of personal information (California)
• Non-discrimination for exercising rights`
    },
    {
      icon: Shield,
      title: "Data Security",
      content: `We implement industry-standard security measures:
• Encryption of data in transit and at rest
• Regular security audits
• Access controls and monitoring
• Secure verification document handling
• Immediate deletion of verification docs after review`
    },
    {
      icon: Trash2,
      title: "Data Retention",
      content: `We retain your data:
• Account data: Until you delete your account
• Exchange records: 3 years for legal compliance
• Verification documents: Deleted immediately after review
• Messages: 2 years or until account deletion
• Activity logs: 1 year`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-slate-600 mb-4">Last updated: February 2026</p>
            <div className="flex justify-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">GDPR Compliant</Badge>
              <Badge className="bg-green-100 text-green-700">CCPA Compliant</Badge>
            </div>
          </div>

          <Card className="border-emerald-200 bg-emerald-50 mb-8">
            <CardContent className="p-6">
              <p className="text-emerald-800 font-medium">
                Your privacy is important to us. This policy explains how NeighborSkill collects, uses, and protects your personal information.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <section.icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">{section.title}</h2>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{section.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Bell className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">Cookies & Tracking</h2>
                    <p className="text-slate-600 leading-relaxed">
                      We use essential cookies for platform functionality and optional analytics cookies to improve our services. You can manage cookie preferences in your browser settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">Children's Privacy</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Our Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact Us</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  For privacy-related questions or to exercise your rights:
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-700">Email: privacy@neighborskill.com</p>
                  <p className="text-slate-700">Data Protection Officer: dpo@neighborskill.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}