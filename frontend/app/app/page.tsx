'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Clock, CheckCircle, ChevronRight, Star, Zap, DollarSign, Building2, TrendingUp, Info } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const LOAN_AMOUNTS = [
  '$25,000 – $50,000',
  '$50,000 – $100,000',
  '$100,000 – $250,000',
  '$250,000 – $500,000',
  '$500,000 – $1,000,000',
  '$1,000,000+',
]

const BUSINESS_TYPES = ['LLC', 'S-Corporation', 'C-Corporation', 'Sole Proprietor', 'Partnership', 'Non-Profit']

const INDUSTRIES = [
  'Restaurant / Food Service', 'Retail', 'Construction / Contracting',
  'Transportation / Logistics', 'Healthcare / Medical', 'Technology / Software',
  'Professional Services', 'Manufacturing', 'Real Estate', 'Other',
]

const APP_ID_MAP: Record<string, string> = {
  '$25,000 – $50,000': 'APP-55891',
  '$50,000 – $100,000': 'APP-55891',
  '$100,000 – $250,000': 'APP-22101',
  '$250,000 – $500,000': 'APP-12345',
  '$500,000 – $1,000,000': 'APP-44512',
  '$1,000,000+': 'APP-33287',
}

const LOAN_AMOUNT_NUMERIC_MAP: Record<string, number> = {
  '$25,000 – $50,000': 37500,
  '$50,000 – $100,000': 75000,
  '$100,000 – $250,000': 175000,
  '$250,000 – $500,000': 375000,
  '$500,000 – $1,000,000': 750000,
  '$1,000,000+': 1500000,
}

const YEARS_OPTIONS = ['Less than 1 year', '1-2 years', '3-5 years', '5-10 years', '10+ years']

const NAVY = '#0d2b57'
const BLUE = '#2563eb'
const BLUE_DARK = '#1d4ed8'

// ── Qualifier Calculator logic ─────────────────────────────────────────────

const TIME_OPTIONS = [
  { label: '1-2 Years', multiplier: 0.50, rateMin: 18, rateMax: 29.99 },
  { label: '2-3 Years', multiplier: 0.70, rateMin: 14, rateMax: 24 },
  { label: '3-5 Years', multiplier: 0.90, rateMin: 10, rateMax: 18 },
  { label: '5+ Years',  multiplier: 1.15, rateMin: 5.99, rateMax: 14 },
]

const CREDIT_OPTIONS = [
  { label: 'Fair', sub: '600 – 649', creditMult: 0.65, rateAdj: 8 },
  { label: 'Good', sub: '650 – 699', creditMult: 0.80, rateAdj: 4 },
  { label: 'Very Good', sub: '700 – 749', creditMult: 1.00, rateAdj: 0 },
  { label: 'Excellent', sub: '750+', creditMult: 1.15, rateAdj: -2 },
]

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}K`
  return `$${n.toLocaleString()}`
}

function fmtFull(n: number): string {
  return '$' + Math.round(n).toLocaleString()
}

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    const start = prev.current
    const diff = target - start
    if (diff === 0) return
    const steps = 24
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (step >= steps) {
        clearInterval(timer)
        prev.current = target
      }
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])
  return display
}

function mapToLoanTier(amount: number): string {
  if (amount <= 50000)  return '$25,000 – $50,000'
  if (amount <= 100000) return '$50,000 – $100,000'
  if (amount <= 250000) return '$100,000 – $250,000'
  return '$250,000 – $500,000'
}

function QualifyCalculator({ onApply }: { onApply: (tier: string) => void }) {
  const [revenue, setRevenue] = useState(75000)
  const [timeIdx, setTimeIdx] = useState(2)
  const [creditIdx, setCreditIdx] = useState(2)

  const time = TIME_OPTIONS[timeIdx]
  const credit = CREDIT_OPTIONS[creditIdx]

  const rawLow  = revenue * time.multiplier * credit.creditMult * 0.80
  const rawHigh = revenue * time.multiplier * credit.creditMult * 1.20
  const low  = Math.min(500000, Math.max(6000, rawLow))
  const high = Math.min(500000, Math.max(6000, rawHigh))

  const rateMin = Math.max(5.99, time.rateMin + credit.rateAdj)
  const rateMax = Math.max(rateMin + 2, time.rateMax + credit.rateAdj)

  const drawExample = Math.round(low * 0.5)
  const monthlyInterestLow  = Math.round(drawExample * (rateMin / 100) / 12)
  const monthlyInterestHigh = Math.round(drawExample * (rateMax / 100) / 12)

  const animLow  = useCountUp(Math.round(low))
  const animHigh = useCountUp(Math.round(high))

  const qualifies = revenue >= 20000

  const sliderPct = ((revenue - 20000) / (500000 - 20000)) * 100

  return (
    <div style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0a2248 60%, #0f2d57 100%)`, padding: '72px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#93c5fd', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 16 }}>
            <TrendingUp size={12} />
            INSTANT ESTIMATE
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.8px' }}>
            See What You Could Qualify For
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto' }}>
            Adjust the inputs below to get an instant estimate based on Cardiff&#39;s real qualification criteria.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

          {/* Left — Inputs */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '36px 36px 32px' }}>

            {/* Revenue slider */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Average Monthly Revenue
                </label>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  {fmt(revenue)}
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>/mo</span>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input
                  type="range"
                  min={20000}
                  max={500000}
                  step={5000}
                  value={revenue}
                  onChange={e => setRevenue(Number(e.target.value))}
                  style={{ width: '100%', appearance: 'none', height: 6, borderRadius: 3, background: `linear-gradient(to right, ${BLUE} ${sliderPct}%, rgba(255,255,255,0.15) ${sliderPct}%)`, outline: 'none', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                <span>$20K/mo min</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={10} />
                  Based on last 3 months average
                </span>
                <span>$500K/mo</span>
              </div>
            </div>

            {/* Time in business */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                Time in Business
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {TIME_OPTIONS.map((t, i) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTimeIdx(i)}
                    style={{
                      padding: '11px 6px',
                      borderRadius: 10,
                      border: timeIdx === i ? `2px solid ${BLUE}` : '1.5px solid rgba(255,255,255,0.12)',
                      background: timeIdx === i ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.04)',
                      color: timeIdx === i ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                      fontSize: 13,
                      fontWeight: timeIdx === i ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit profile */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                Credit Profile
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CREDIT_OPTIONS.map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCreditIdx(i)}
                    style={{
                      padding: '11px 6px',
                      borderRadius: 10,
                      border: creditIdx === i ? `2px solid ${BLUE}` : '1.5px solid rgba(255,255,255,0.12)',
                      background: creditIdx === i ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.04)',
                      color: creditIdx === i ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      fontWeight: creditIdx === i ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div>{c.label}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Min revenue warning */}
            {revenue < 20000 && (
              <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
                Cardiff requires a minimum of $20,000/month in revenue to qualify.
              </div>
            )}
          </div>

          {/* Right — Result card */}
          <div>
            {qualifies ? (
              <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                {/* Result header */}
                <div style={{ background: `linear-gradient(135deg, #059669, #047857)`, padding: '24px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <CheckCircle size={16} color="rgba(255,255,255,0.8)" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>You May Qualify For</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Based on your inputs &#8212; actual offer may vary</div>
                </div>

                <div style={{ padding: '26px 26px 22px' }}>
                  {/* Line amount */}
                  <div style={{ marginBottom: 24, padding: '20px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Estimated Credit Line
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 900, color: NAVY, letterSpacing: '-1px', lineHeight: 1 }}>
                      {fmtFull(animLow)}
                    </div>
                    <div style={{ fontSize: 16, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
                      up to {fmtFull(animHigh)}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Rate Range</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>
                        {rateMin.toFixed(2)}% &#8212; {rateMax.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>APR</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Draw Example</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{fmtFull(drawExample)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>50% of line</div>
                    </div>
                  </div>

                  {/* Monthly cost example */}
                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #bfdbfe', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      Monthly Interest on {fmtFull(drawExample)} Draw
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>
                      {fmtFull(monthlyInterestLow)} &#8212; {fmtFull(monthlyInterestHigh)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                      Pay only for what you use &#183; No prepayment penalties
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onApply(mapToLoanTier(animHigh))
                      document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', padding: '14px',
                      background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                      color: '#fff', border: 'none', borderRadius: 11,
                      fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                      boxSizing: 'border-box',
                    }}
                  >
                    Apply for {fmtFull(animHigh)}
                    <ChevronRight size={16} />
                  </button>
                  <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
                    No hard credit pull &#183; Decision in minutes
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <div style={{ background: '#f1f5f9', padding: '24px 26px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Minimum Revenue Required</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Cardiff requires $20K/month to qualify</div>
                </div>
                <div style={{ padding: '24px 26px' }}>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: '0 0 16px' }}>
                    Your business needs to generate at least <strong>$20,000/month</strong> in revenue over the past 3 months to qualify for a Cardiff Business Line of Credit.
                  </p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
                    Adjust the slider up to see your estimated credit line.
                  </p>
                </div>
              </div>
            )}

            {/* Fine print */}
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
                This estimate is based on Cardiff&#39;s published qualification criteria and industry-standard underwriting. Actual offer amounts and rates depend on full underwriting review, Plaid bank verification, and other factors. Not a guaranteed offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    loanAmount: '',
    businessType: '',
    industry: '',
    yearsInBusiness: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const appId = APP_ID_MAP[form.loanAmount] || 'APP-12345'
    try {
      await Promise.allSettled([
        fetch(`${API}/api/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: appId,
            applicant_name: form.ownerName,
            business_name: form.businessName,
            loan_amount: LOAN_AMOUNT_NUMERIC_MAP[form.loanAmount] || 0,
            business_type: form.businessType,
          }),
        }),
        fetch('https://demo.maxevdigital.com/api/lending-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, applicationId: appId }),
        }),
      ])
      router.push(`/submitted?name=${encodeURIComponent(form.ownerName)}&app=${appId}`)
    } catch {
      setSubmitting(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0f172a',
    background: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }

  const inputFocused: React.CSSProperties = {
    ...inputBase,
    borderColor: BLUE,
    boxShadow: `0 0 0 3px rgba(37,99,235,0.12)`,
  }

  const getInputStyle = (field: string) => focusedField === field ? inputFocused : inputBase

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: NAVY, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-1px' }}>C</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: NAVY, letterSpacing: '-0.4px', lineHeight: 1.1 }}>Cardiff</div>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Business Lending</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Products', 'Rates', 'About', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 14, color: '#475569', cursor: 'pointer', fontWeight: 500 }}>{l}</span>
          ))}
          <a href="#apply-form" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: BLUE, padding: '9px 20px', borderRadius: 8, textDecoration: 'none' }}>
            Apply Now
          </a>
        </div>
      </nav>

      {/* Trust bar */}
      <div style={{ background: NAVY, padding: '10px 0' }}>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'center' }}>
          {[
            { icon: <CheckCircle size={13} />, text: 'No Hard Credit Pull' },
            { icon: <Shield size={13} />, text: 'SSL Encrypted' },
            { icon: <Star size={13} />, text: 'BBB A+ Rated' },
            { icon: <Clock size={13} />, text: 'Approvals in Minutes' },
            { icon: <DollarSign size={13} />, text: '$12B+ Funded' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#93c5fd' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Hero + Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', maxWidth: 1200, margin: '0 auto', gap: 0, padding: '60px 40px 80px', alignItems: 'start' }}>

        {/* Left — Hero */}
        <div style={{ paddingRight: 64, paddingTop: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: BLUE, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 24 }}>
            <Zap size={12} />
            AI-POWERED DECISIONS IN MINUTES
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: NAVY, margin: '0 0 20px', lineHeight: 1.08, letterSpacing: '-1.5px' }}>
            Fast Capital<br />
            <span style={{ color: BLUE }}>Built for Small</span><br />
            Business.
          </h1>
          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 460 }}>
            Cardiff has funded over <strong style={{ color: NAVY }}>$12 billion</strong> to small businesses across America. Lines of credit up to <strong style={{ color: NAVY }}>$500,000</strong> with approvals that don&#39;t touch your credit score.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 40, maxWidth: 420 }}>
            {[
              { num: '$12B+', lbl: 'Total Funded', color: BLUE },
              { num: '50K+', lbl: 'Businesses Served', color: '#7c3aed' },
              { num: '< 24 hrs', lbl: 'Average Funding Time', color: '#059669' },
              { num: 'Since 2006', lbl: 'Nearly 20 Years', color: '#d97706' },
            ].map(({ num, lbl, color }) => (
              <div key={lbl} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', borderLeft: `4px solid ${color}` }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, letterSpacing: '-0.5px' }}>{num}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>How It Works</div>
            {[
              { title: 'Apply in 3 minutes', desc: 'Fill out our simple form &#8212; no hard credit pull required.', icon: <Building2 size={16} color={BLUE} /> },
              { title: 'AI reviews instantly', desc: 'Our AI cross-references your business data across Plaid, Snowflake, and Salesforce in real time.', icon: <Zap size={16} color={BLUE} /> },
              { title: 'Funds in your account', desc: 'Approved businesses can access capital within 24 hours.', icon: <DollarSign size={16} color={BLUE} /> },
            ].map(({ title, desc, icon }, i) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < 2 ? 18 : 0 }}>
                <div style={{ width: 38, height: 38, background: '#eff6ff', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                  {icon}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: desc }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', borderLeft: `4px solid ${BLUE}`, maxWidth: 440 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>
              &#34;We had capital in our account within 18 hours of applying. The AI review process was seamless.&#34;
            </p>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Maria R. &#183; Owner, Mesa Verde Catering Co.</div>
          </div>
        </div>

        {/* Right — Form */}
        <div id="apply-form" style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a4fa0 100%)`, padding: '24px 28px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Apply for a Line of Credit</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>No hard credit pull &#183; Decision in minutes</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {[{ label: 'No Hard Pull', icon: <Shield size={11} /> }, { label: 'SSL Secured', icon: <CheckCircle size={11} /> }, { label: 'Up to $500K', icon: <DollarSign size={11} /> }].map(({ label: lbl, icon }) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#bfdbfe', background: 'rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: 12 }}>
                    {icon}{lbl}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '28px 28px 24px' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...label, fontSize: 14, color: NAVY }}>How much capital do you need?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {LOAN_AMOUNTS.map(amount => {
                      const selected = form.loanAmount === amount
                      return (
                        <button key={amount} type="button" onClick={() => set('loanAmount', amount)} style={{ padding: '10px 8px', borderRadius: 9, border: selected ? `2px solid ${BLUE}` : '1.5px solid #e2e8f0', background: selected ? '#eff6ff' : '#f8fafc', color: selected ? BLUE : '#374151', fontSize: 12, fontWeight: selected ? 700 : 500, cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s', boxShadow: selected ? `0 0 0 1px ${BLUE}22` : 'none' }}>
                          {amount}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 16px', marginBottom: 16 }}>
                  {[
                    { key: 'businessName', label: 'Business Name', placeholder: 'Acme LLC', type: 'text' },
                    { key: 'ownerName', label: 'Owner Name', placeholder: 'Jane Smith', type: 'text' },
                    { key: 'email', label: 'Business Email', placeholder: 'jane@acme.com', type: 'email' },
                    { key: 'phone', label: 'Phone Number', placeholder: '(214) 555-0100', type: 'tel' },
                  ].map(({ key, label: lbl, placeholder, type }) => (
                    <div key={key}>
                      <label style={label}>{lbl}</label>
                      <input style={getInputStyle(key)} type={type} placeholder={placeholder} value={(form as Record<string,string>)[key]} onChange={e => set(key, e.target.value)} onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} required />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 16px', marginBottom: 24 }}>
                  <div>
                    <label style={label}>Business Structure</label>
                    <select style={getInputStyle('businessType')} value={form.businessType} onChange={e => set('businessType', e.target.value)} onFocus={() => setFocusedField('businessType')} onBlur={() => setFocusedField(null)} required>
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Years in Business</label>
                    <select style={getInputStyle('yearsInBusiness')} value={form.yearsInBusiness} onChange={e => set('yearsInBusiness', e.target.value)} onFocus={() => setFocusedField('yearsInBusiness')} onBlur={() => setFocusedField(null)} required>
                      <option value="">Select</option>
                      {YEARS_OPTIONS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={label}>Industry</label>
                    <select style={getInputStyle('industry')} value={form.industry} onChange={e => set('industry', e.target.value)} onFocus={() => setFocusedField('industry')} onBlur={() => setFocusedField(null)} required>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '15px', background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, color: '#fff', border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 4px 14px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting ? (
                    <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Submitting...</>
                  ) : (
                    <>Get My Rate &#8212; No Hard Pull<ChevronRight size={16} /></>
                  )}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
                  By submitting you agree to our Terms. SSL encrypted. No obligation.
                </p>
              </form>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14 }}>
            {[{ label: 'BBB A+', sub: 'Accredited' }, { label: 'FDIC', sub: 'Member' }, { label: 'Equal', sub: 'Opportunity Lender' }].map(({ label: lbl, sub }) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{lbl}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Qualifier Calculator */}
      <QualifyCalculator onApply={(tier) => set('loanAmount', tier)} />

      {/* Footer */}
      <div style={{ background: NAVY, padding: '32px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.12)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>C</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Cardiff Business Lending</span>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {['Privacy Policy', 'Terms of Service', 'Rates', 'Contact'].map(l => (
                <span key={l} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 20, paddingTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
            Cardiff Business Lending is a licensed lender. California Finance Lender License #60DBO-129171. This is a demo application powered by AI. Not actual financial services.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid ${BLUE}; cursor: pointer; box-shadow: 0 2px 8px rgba(37,99,235,0.4); }
        input[type=range]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: white; border: 3px solid ${BLUE}; cursor: pointer; box-shadow: 0 2px 8px rgba(37,99,235,0.4); }
      `}</style>
    </div>
  )
}
