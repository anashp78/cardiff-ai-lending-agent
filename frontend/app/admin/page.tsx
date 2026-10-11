'use client'

import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Step {
  step_id: string
  tool_called: string | null
  model_used: string
  latency_ms: number
  output: Record<string, unknown>
  timestamp: string
}

interface Run {
  run_id: string
  application_id: string
  started_at: string
  completed_at: string | null
  status: string
  decision: string | null
  confidence: number | null
  reasoning?: string
  mock_mode: boolean
  step_count: number
  steps?: Step[]
}

const DECISION_COLORS: Record<string, string> = {
  APPROVE: '#16a34a',
  MANUAL_REVIEW: '#d97706',
  DECLINE: '#dc2626',
}

const TOOL_COLORS: Record<string, string> = {
  snowflake_query: '#29b6f6',
  salesforce_query: '#00bcd4',
  send_gmail: '#ef5350',
  post_slack: '#7c3aed',
  create_zoom_meeting: '#0288d1',
}

function StepRow({ step, index }: { step: Step; index: number }) {
  const color = step.tool_called ? TOOL_COLORS[step.tool_called] || '#64748b'
    : step.model_used === 'sonnet' ? '#6366f1' : '#0ea5e9'
  const label = step.tool_called || step.model_used

  let summary = ''
  const o = step.output
  if (o?.credit_score) summary = `Credit ${o.credit_score} · Risk ${o.risk_score} · ${o.recommended_action}`
  else if (o?.account_name) summary = `${o.account_name} · ${o.relationship_tier} · Rep: ${o.assigned_rep}`
  else if (o?.risk_level && !o?.credit_score) summary = `${o.risk_level} · ${o.route_to}`
  else if (o?.status === 'sent') summary = `Email sent to ${o.to}`
  else if (o?.status === 'posted') summary = `Slack posted`
  else if (o?.status === 'created') summary = `Zoom meeting created`
  else if (o?.status === 'skipped') summary = 'Skipped'
  else if (o?.recommended_action) summary = `${o.recommended_action} · ${Math.round((o.confidence as number) * 100)}% confidence`

  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #1e293b', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace', minWidth: 18, paddingTop: 2 }}>{index + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
            color, background: `${color}18`, border: `1px solid ${color}30`,
            padding: '1px 7px', borderRadius: 4,
          }}>{label}</span>
          <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>{step.latency_ms}ms</span>
        </div>
        {summary && <div style={{ fontSize: 12, color: '#64748b' }}>{summary}</div>}
      </div>
    </div>
  )
}

function RunCard({ run, expanded, onToggle }: { run: Run; expanded: boolean; onToggle: () => void }) {
  const [detail, setDetail] = useState<Run | null>(null)

  useEffect(() => {
    if (expanded && !detail) {
      fetch(`${API}/api/runs/${run.run_id}`).then(r => r.json()).then(setDetail).catch(() => {})
    }
  }, [expanded, run.run_id, detail])

  const dc = run.decision ? DECISION_COLORS[run.decision] || '#64748b' : '#64748b'

  return (
    <div style={{
      background: expanded ? '#111827' : '#0d1117',
      border: `1px solid ${expanded ? '#334155' : '#1e293b'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'all 0.15s',
    }}>
      <div onClick={onToggle} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{run.run_id}</span>
          <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{run.application_id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {run.decision && (
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
              color: dc, background: `${dc}15`, border: `1px solid ${dc}40`,
              padding: '2px 8px', borderRadius: 4,
            }}>{run.decision}</span>
          )}
          {run.confidence && (
            <span style={{ fontSize: 11, color: '#64748b' }}>{Math.round(run.confidence * 100)}%</span>
          )}
          <span style={{
            fontSize: 11, padding: '2px 6px', borderRadius: 4,
            background: run.status === 'COMPLETE' ? '#16a34a20' : '#ea580c20',
            color: run.status === 'COMPLETE' ? '#4ade80' : '#fb923c',
          }}>{run.status}</span>
          <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>{run.mock_mode ? 'MOCK' : 'LIVE'}</span>
          <span style={{ fontSize: 11, color: '#475569' }}>{new Date(run.started_at).toLocaleTimeString()}</span>
          <span style={{ fontSize: 11, color: '#334155' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && detail && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #1e293b' }}>
          {detail.reasoning && (
            <div style={{
              background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8,
              padding: '12px 14px', margin: '14px 0',
              fontSize: 12, color: '#94a3b8', lineHeight: 1.7,
            }}>
              <div style={{ fontSize: 10, color: '#6366f1', fontFamily: 'monospace', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>SONNET REASONING</div>
              {detail.reasoning}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            {(detail.steps || []).map((s, i) => <StepRow key={s.step_id} step={s} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPanel() {
  const [runs, setRuns] = useState<Run[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [health, setHealth] = useState<{ mock_mode: boolean } | null>(null)
  const [polling, setPolling] = useState(false)

  const fetchRuns = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/runs`)
      setRuns(await r.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetch(`${API}/api/health`).then(r => r.json()).then(setHealth).catch(() => {})
    fetchRuns()
    const iv = setInterval(fetchRuns, 4000)
    return () => clearInterval(iv)
  }, [fetchRuns])

  useEffect(() => {
    const running = runs.some(r => r.status === 'RUNNING')
    setPolling(running)
    if (running) {
      const iv = setInterval(fetchRuns, 1500)
      return () => clearInterval(iv)
    }
  }, [runs, fetchRuns])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid #1e293b', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: '#1e3a5f', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>C</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Cardiff</span>
          <span style={{ fontSize: 12, color: '#334155' }}>/</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>AI Underwriting Ops</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {polling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fb923c' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', animation: 'pulse 1s infinite' }} />
              Processing
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: health ? '#16a34a' : '#374151', boxShadow: health ? '0 0 6px #16a34a' : 'none' }} />
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
              {health ? `LIVE${health.mock_mode ? ' · MOCK' : ''}` : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            ['Total Reviews', runs.length],
            ['Approved', runs.filter(r => r.decision === 'APPROVE').length],
            ['Manual Review', runs.filter(r => r.decision === 'MANUAL_REVIEW').length],
            ['Declined', runs.filter(r => r.decision === 'DECLINE').length],
          ].map(([label, val]) => (
            <div key={label as string} style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Run list */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
            RECENT APPLICATIONS ({runs.length})
          </span>
          <span style={{ fontSize: 11, color: '#1e293b' }}>Auto-refreshing every 4s</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {runs.map(run => (
            <RunCard
              key={run.run_id}
              run={run}
              expanded={expanded === run.run_id}
              onToggle={() => setExpanded(expanded === run.run_id ? null : run.run_id)}
            />
          ))}
        </div>

        {runs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#1e293b', fontSize: 14 }}>
            No applications processed yet. Submit a loan application to trigger the AI agent.
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
