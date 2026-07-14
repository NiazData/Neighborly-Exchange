import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Scale, Shield, Users, AlertTriangle, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Terms() {
  const sections = [
    {
      icon: Users,
      title: "1. Acceptance of Terms",
      content: `By accessing and using NeighborSkill ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.`
    },
    {
      icon: Shield,
      title: "2. User Accounts",
      content: `You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate and complete information during registration.`
    },
    {
      icon: Scale,
      title: "3. Skill Exchange Rules",
      content: `The Platform facilitates skill exchanges between neighbors on a barter basis. No monetary transactions are permitted through the Platform. Users are solely responsible for the quality and safety of services exchanged. The Platform does not guarantee the outcome of any exchange.`
    },
    {
      icon: FileText,
      title: "4. User Conduct",
      content: `You agree not to:
• Post false, misleading, or fraudulent content
• Harass, threaten, or abuse other users
• Use the Platform for illegal activities
• Attempt to circumvent the Platform's security measures
• Create multiple accounts or impersonate others
• Share inappropriate or offensive content`
    },
    {
      icon: AlertTriangle,
      title: "5. Verification & Trust",
      content: `Identity verification is voluntary but encouraged. Verified users have completed our ID verification process. However, verification does not guarantee user trustworthiness. Users should exercise their own judgment when engaging with others.`
    },
    {
      icon: Ban,
      title: "6. Prohibited Activities",
      content: `The following are strictly prohibited:
• Requesting or offering monetary payment
• Commercial activities or professional services for profit
• Activities that violate local laws
• Exchanges involving hazardous or illegal goods
• Any form of discrimination`
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-slate-600">Last updated: February 2026</p>
          </div>

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
                <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Limitation of Liability</h2>
                <p className="text-slate-600 leading-relaxed">
                  The Platform is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Platform or any skill exchanges conducted through it. Users participate in exchanges at their own risk.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Termination</h2>
                <p className="text-slate-600 leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of these terms or for any reason at our discretion. You may also delete your account at any time through the settings page.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Changes to Terms</h2>
                <p className="text-slate-600 leading-relaxed">
                  We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or platform notification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">10. Contact Information</h2>
                <p className="text-slate-600 leading-relaxed">
                  For questions about these Terms of Service, please contact us at support@neighborskill.com
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}