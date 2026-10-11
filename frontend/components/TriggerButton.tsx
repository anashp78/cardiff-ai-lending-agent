'use client'

interface Props {
  loading: boolean
  onTrigger: () => void
}

export default function TriggerButton({ loading, onTrigger }: Props) {
  return (
    <button
      onClick={onTrigger}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        background: loading ? '#1e293b' : '#ea580c',
        color: loading ? '#64748b' : '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid #334155',
            borderTopColor: '#ea580c',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }} />
          Running agent...
        </>
      ) : (
        <>
          <span style={{ fontSize: 16 }}>▶</span>
          Run Agent — APP-12345
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
