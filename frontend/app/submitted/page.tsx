'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SubmittedContent() {
  const params = useSearchParams()
  const name = params.get('name') || 'Applicant'
  const app = params.get('app') || 'APP-12345'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '48px 56px', maxWidth: 520, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 56, height: 56, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 28 }}>&#10003;</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Application Received</h1>
        <p style={{ fontSize: 15, color: '#475569', marginBottom: 24, lineHeight: 1.6 }}>
          Thank you, <strong>{name}</strong>. Your application <strong style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{app}</strong> is now being reviewed by our AI underwriting system.
        </p>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, marginBottom: 8 }}>What happens next</div>
          <div style={{ fontSize: 13, color: '#0c4a6e', textAlign: 'left', lineHeight: 1.8 }}>
            1. AI reviews your risk profile against our lending criteria<br />
            2. Your assigned rep receives an automated briefing<br />
            3. You will be contacted within 1 business hour
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Average decision time: <strong>8 minutes</strong></p>
      </div>
    </div>
  )
}

export default function SubmittedPage() {
  return (
    <Suspense>
      <SubmittedContent />
    </Suspense>
  )
}
