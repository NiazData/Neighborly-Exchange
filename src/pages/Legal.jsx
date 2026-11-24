import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Scale, Building, FileText, AlertCircle, Copyright, Gavel,
  ShieldCheck, Receipt, Handshake, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';
import { createPageUrl } from '@/utils';

// ---------------------------------------------------------------------------
// Fill these in before deploying. Search the codebase for "PLACEHOLDER" —
// nothing containing it should ship to production.
// ---------------------------------------------------------------------------
const EFFECTIVE_DATE = '[PLACEHOLDER — LAUNCH DATE, e.g. December 1, 2026]';
const OPERATOR = '[PLACEHOLDER — OPERATOR LEGAL NAME]';
const CONTACT_EMAIL = '[PLACEHOLDER — CONTACT EMAIL]';
const ADDRESS = '[PLACEHOLDER — POSTAL ADDRESS (registered agent or virtual office is fine; no P.O. box)]';
const PHONE = '[PLACEHOLDER — PHONE NUMBER]';
const JURISDICTION = '[PLACEHOLDER — JURISDICTION, e.g. the State of California]';
const DMCA_AGENT = '[PLACEHOLDER — DMCA AGENT NAME, as registered with the U.S. Copyright Office]';
const DMCA_EMAIL = '[PLACEHOLDER — DMCA AGENT EMAIL]';

const linkClass = 'text-emerald-700 underline underline-offset-2 hover:text-emerald-800';

function Section({ icon: Icon, title, delay, tone = 'default', children }) {
  const amber = tone === 'amber';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={amber ? 'border-amber-200 bg-amber-50' : 'border-slate-100'}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${amber ? 'bg-amber-100' : 'bg-emerald-50'}`}>
              <Icon className={`w-5 h-5 ${amber ? 'text-amber-700' : 'text-emerald-600'}`} />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl font-semibold mb-3 ${amber ? 'text-amber-800' : 'text-slate-800'}`}>
                {title}
              </h2>
              <div className={`space-y-4 leading-relaxed ${amber ? 'text-amber-700' : 'text-slate-600'}`}>
                {children}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo
        title="Legal Notice"
        path="/Legal"
        description="Legal information about the Neighborly Exchange platform."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Legal Notice</h1>
            <p className="text-slate-600">Effective: {EFFECTIVE_DATE}</p>
            <p className="text-slate-500 text-sm mt-2">
              Using the platform is governed by our{' '}
              <Link to={createPageUrl('Terms')} className={linkClass}>Terms of Service</Link>
              {' '}and{' '}
              <Link to={createPageUrl('Privacy')} className={linkClass}>Privacy Policy</Link>.
              This page summarizes key legal information.
            </p>
          </div>

          <div className="space-y-6">
            <Section icon={Building} title="Operator Information" delay={0.05}>
              <div className="space-y-2">
                <p><strong>Operator:</strong> {OPERATOR}</p>
                <p><strong>Address:</strong> {ADDRESS}</p>
                <p><strong>Phone:</strong> {PHONE}</p>
                <p><strong>Email:</strong> {CONTACT_EMAIL}</p>
              </div>
            </Section>

            <Section icon={FileText} title="Platform Description" delay={0.1}>
              <p>
                Neighborly Exchange is a free community platform that facilitates skill exchanges between
                neighbors. The platform operates on a barter basis and does not process monetary transactions
                between members. We provide the technology to connect members but are not a party to any
                exchange agreement between them.
              </p>
            </Section>

            <Section icon={AlertCircle} title="Disclaimer" delay={0.15}>
              <p>
                Neighborly Exchange does not guarantee, endorse, or verify the quality, safety, legality, or
                suitability of any skills, services, or members. Members participate at their own discretion
                and risk.
              </p>
              <p>
                The Verified badge indicates that a member confirmed their email address and completed a
                profile that was approved by a moderator. It is not an identity or background check.
              </p>
            </Section>

            <Section icon={ShieldCheck} title="Meeting Safely" delay={0.2}>
              <p>
                Most exchanges happen in person. Use caution when meeting other members — we recommend a
                safe, public place for a first exchange. Neighborly Exchange is not responsible for the
                conduct of members on or off the platform.
              </p>
            </Section>

            <Section icon={Receipt} title="Taxes" delay={0.25}>
              <p>
                Bartered goods and services can count as taxable income. Members are responsible for
                determining and meeting their own tax obligations for exchanges they make. Neighborly Exchange
                does not provide tax advice.
              </p>
            </Section>

            <Section icon={Copyright} title="Intellectual Property" delay={0.3}>
              <p>
                All platform content, trademarks, logos, and design elements are owned by {OPERATOR} or its
                licensors. You may not reproduce, distribute, or create derivative works from them without
                explicit permission.
              </p>
              <p>
                Content you post (listings, profile text, photos, messages) remains yours. By posting it, you
                grant {OPERATOR} a worldwide, royalty-free, non-exclusive license to host, store, reproduce,
                adapt (for example, resizing or formatting), and display that content solely to operate and
                provide the service. This license ends when you delete the content or your account, except
                for copies retained in backups for a limited period or as required by law.
              </p>
            </Section>

            <Section icon={Copyright} title="Copyright Complaints (DMCA)" delay={0.35}>
              <p>
                If you believe content on Neighborly Exchange infringes your copyright, send a notice to our
                designated agent: <strong>{DMCA_AGENT}</strong>, {ADDRESS}, {DMCA_EMAIL}.
              </p>
              <p>
                Your notice should identify the copyrighted work, the material you believe is infringing and
                where it appears, your contact information, a statement that you have a good-faith belief the
                use is not authorized, a statement under penalty of perjury that your notice is accurate and
                that you are the owner or authorized to act for the owner, and your physical or electronic
                signature. We remove infringing content promptly and terminate the accounts of repeat
                infringers in appropriate circumstances.
              </p>
            </Section>

            <Section icon={Gavel} title="Governing Law & Jurisdiction" delay={0.4}>
              <p>
                The Terms of Service and any disputes arising from the use of Neighborly Exchange are governed
                by the laws of {JURISDICTION}, without regard to conflict of law principles.
              </p>
            </Section>

            <Section icon={Handshake} title="Dispute Resolution" delay={0.45}>
              <p>
                We encourage members to resolve disputes directly with each other. For issues that cannot be
                resolved between members, please use the in-app report system, or contact us at{' '}
                {CONTACT_EMAIL}.
              </p>
              <p>
                <strong>Notice for California residents:</strong> Neighborly Exchange is free to use. Under
                California Civil Code § 1789.3, you may contact the Complaint Assistance Unit of the Division
                of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North
                Market Blvd., Suite N 112, Sacramento, CA 95834, or by telephone at (800) 952-5210.
              </p>
            </Section>

            <Section icon={Info} title="Important Notice" delay={0.5} tone="amber">
              <p>
                This legal notice is provided for informational purposes only and does not constitute legal
                advice. For specific legal advice, please consult with a qualified attorney. Neighborly
                Exchange reserves the right to update this notice at any time.
              </p>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
