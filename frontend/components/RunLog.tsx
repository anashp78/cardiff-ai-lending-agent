'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Step {
  step_id: string
  tool_called: string | null
  model_used: string
  latency_ms: number
  input: Record<string, any>
  output: Record<string, any>
  timestamp: string
}

interface RunDetail {
  run_id: string
  status: string
  decision: string | null
  confidence: number | null
  reasoning?: string
  steps: Step[]
}

const modelColor = (m: string) => m === 'sonnet' ? '#6366f1' : m === 'haiku' ? '#0ea5e9' : '#475569'
const toolColor = (t: string | null) => {
  if (!t) return '#475569'
  const map: Record<string, string> = {
    snowflake_query: '#29b6f6',
    salesforce_query: '#00bfa5',
    send_gmail: '#ef5350',
    post_slack: '#7c3aed',
    create_zoom_meeting: '#0288d1',
  }
  return map[t] || '#64748b'
}

export default function RunLog({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunDetail | null>(null)

  useEffect(() => {
    fetch(`${API}/api/runs/${runId}`)
      .then(r => r.json())
      .then(setRun)
      .catch(() => {})
  }, [runId])

  if (!run) return <div style={{ color: '#475569', fontSize: 13, padding: '8px 0' }}>Loading...</div>

  return (
    <div>
      {run.reasoning && (
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 8, padding: 12, marginBottom: 12,
          fontSize: 13, color: '#94a3b8', lineHeight: 1.6,
        }}>
          <span style={{ color: '#6366f1', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>
            SONNET REASONING
          </span>
          <div style={{ marginTop: 6 }}>{run.reasoning}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {run.steps.map((step, i) => (
          <div key={step.step_id} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '8px 0',
            borderBottom: i < run.steps.length - 1 ? '1px solid #1e293b' : 'none',
          }}>
            <div style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace', minWidth: 20, marginTop: 2 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                {step.tool_called ? (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                    color: toolColor(step.tool_called),
                    background: `${toolColor(step.tool_called)}15`,
                    border: `1px solid ${toolColor(step.tool_called)}30`,
                    padding: '1px 6px', borderRadius: 3,
                  }}>
                    {step.tool_called}
                  </span>
                ) : (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                    color: modelColor(step.model_used),
                    background: `${modelColor(step.model_used)}15`,
                    border: `1px solid ${modelColor(step.model_used)}30`,
                    padding: '1px 6px', borderRadius: 3,
                  }}>
                    {step.model_used}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>
                  {step.latency_ms}ms
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {step.output?.status === 'sent' && `Email sent to ${step.output.to}`}
                {step.output?.status === 'posted' && `Slack posted — ts ${step.output.ts}`}
                {step.output?.status === 'created' && `Zoom meeting created — ${step.output.join_url}`}
                {step.output?.status === 'skipped' && 'Skipped by user'}
                {step.output?.credit_score && `Credit: ${step.output.credit_score} · Risk: ${step.output.risk_score} · Action: ${step.output.recommended_action}`}
                {step.output?.account_name && `${step.output.account_name} · ${step.output.relationship_tier} · Rep: ${step.output.assigned_rep}`}
                {step.output?.risk_level && !step.output.credit_score && `${step.output.risk_level} · ${step.output.route_to}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
