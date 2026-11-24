import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Scale, Shield, Users, AlertTriangle, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';

export default function Terms() {
  const sections = [
    {
      icon: Users,
      title: "1. Acceptance of Terms",
      content: `By accessing and using Neighborly Exchange ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.`
    },
    {
      icon: Shield,
      title: "2. Eligibility & Accounts",
      content: `You must be at least 16 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate and complete information during registration.`
    },
    {
      icon: Scale,
      title: "3. Free, Non-Commercial Exchanges",
      content: `Neighborly Exchange is completely free to use. The Platform facilitates skill exchanges between neighbors on a barter basis only — no money changes hands between members for an exchange, and the platform does not charge fees or process payments. Requesting or offering monetary payment through the Platform is not permitted.`
    },
    {
      icon: FileText,
      title: "4. Member Conduct",
      content: `You agree to:
• Keep your listings and profile accurate and honest
• Communicate with other members respectfully
• Not offer or request illegal services or goods
• Not harass, threaten, or abuse other members
• Not attempt to circumvent the Platform's safety measures
• Not create multiple accounts or impersonate others`
    },
    {
      icon: AlertTriangle,
      title: "5. Verification & Trust",
      content: `The Verified badge indicates that a member has confirmed their email address and completed a profile that has been approved by a moderator. It is not an identity check or background check, and it does not guarantee a member's trustworthiness. Use your own judgment when engaging with others.`
    },
    {
      icon: Ban,
      title: "6. Moderation",
      content: `We may hide listings, issue warnings, or suspend or ban accounts that violate these terms, with notice provided in-app. If you believe a decision was made in error, you can contact us using the details below.`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo
        title="Terms of Service"
        path="/Terms"
        description="The terms that govern using Neighborly Exchange."
      />
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
            <p className="text-slate-600">Effective: July 2026</p>
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
                <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Exchanges Are Between Members</h2>
                <p className="text-slate-600 leading-relaxed">
                  Exchanges arranged through the Platform are agreements between the members involved. We recommend meeting in safe, public locations for the first exchange. Neighborly Exchange is not a party to any exchange and is not liable for the outcome, quality, or safety of any exchange conducted through the Platform.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Account Termination</h2>
                <p className="text-slate-600 leading-relaxed">
                  We reserve the right to suspend or terminate your account for violation of these terms. You may delete your account at any time from Settings; see our Privacy Policy for what happens to your data when you do.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Limitation of Liability</h2>
                <p className="text-slate-600 leading-relaxed">
                  The Platform is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any damages arising from your use of the Platform or any skill exchange conducted through it. Members participate at their own risk.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">10. Changes to These Terms</h2>
                <p className="text-slate-600 leading-relaxed">
                  We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify members of significant changes via in-app notice.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">11. Contact</h2>
                <p className="text-slate-600 leading-relaxed">
                  For questions about these Terms of Service, contact us at [PLACEHOLDER — CONTACT EMAIL].
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
