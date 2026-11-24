import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Eye, Database, Lock, MapPin, Trash2, Bell, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: `We collect information you provide directly:
• Account email
• The profile information you write (bio, photo, skills)
• Phone number (optional — only if you choose to add it; you control whether it is shown to other members via Settings)
• Listings you create
• Exchange records (who you exchanged with, and when)
• Messages you send to other members
• Reviews and ratings

We do not collect payment information — the Platform is free and does not process payments.`
    },
    {
      icon: MapPin,
      title: "Location Privacy",
      content: `We store the area point you set. Other members only ever see an approximated location, offset by up to ~300 metres, and your suburb name — never your exact position or address. We do not collect street addresses.`
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: `We use your information to:
• Operate your account and profile
• Show your listings to nearby neighbors, using the approximated location described above
• Deliver messages and exchange notifications
• Review reports and moderate the platform
• Comply with legal obligations`
    },
    {
      icon: Lock,
      title: "Service Providers",
      content: `We use a small number of service providers to run the Platform:
• Supabase — database, authentication, and file storage
• Netlify — hosting

We do not use advertising trackers, we do not sell your data, and we do not use analytics cookies. Your information is not shared with anyone beyond these processors, other members (as part of using the Platform), and moderators reviewing a report.

The interactive map loads its map imagery from OpenStreetMap. Like any web request, OpenStreetMap's servers receive your IP address when tiles load; no profile data is ever sent to them.`
    },
    {
      icon: Bell,
      title: "Message Privacy",
      content: `Messages you send are visible only to the two members in that conversation. If a conversation is reported, moderators may review it solely to investigate the report.`
    },
    {
      icon: Shield,
      title: "Data Security",
      content: `We rely on Supabase's access controls and encryption in transit to protect your data. Access to member data is restricted to what is needed to operate and moderate the Platform.`
    },
    {
      icon: Trash2,
      title: "Retention & Deletion",
      content: `You can delete your account at any time from Settings. Doing so erases your profile and listings. Messages and reviews you exchanged with other members are retained but de-identified, so the other member's conversation and review history stays intact without being linked back to you.`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo
        title="Privacy Policy"
        path="/Privacy"
        description="How Neighborly Exchange collects, uses, and protects your data."
      />
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
            <p className="text-slate-600 mb-4">Effective: July 2026</p>
          </div>

          <Card className="border-emerald-200 bg-emerald-50 mb-8">
            <CardContent className="p-6">
              <p className="text-emerald-800 font-medium">
                Neighborly Exchange is free to use, with no ads and no tracking. This policy explains what information we collect, how it's used, and how location privacy works.
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
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Rights</h2>
                    <p className="text-slate-600 leading-relaxed">
                      You can access and correct your information at any time from your profile and settings. You can delete your data by deleting your account, as described above. For questions about exercising these rights, contact us at [PLACEHOLDER — CONTACT EMAIL].
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
                  <p className="text-slate-700">Email: [PLACEHOLDER — CONTACT EMAIL]</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
