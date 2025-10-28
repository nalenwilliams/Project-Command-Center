import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CommandBar(){
  const [cmd, setCmd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function run(){
    setLoading(true); setErr('')
    try{
      const r = await fetch('/nav/resolve',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ command: cmd })
      })
      const j = await r.json()
      if (j.intent==='NAVIGATE' && j.route){
        navigate(j.route)
      }else{
        setErr('No screen found. Try: '+(j.suggestions?.slice(0,5).join(', ')||'dashboard, payroll, onboarding'))
      }
    }catch(e){ setErr('Command router offline.') }
    finally{ setLoading(false); setCmd('') }
  }
  function onKey(e){ if(e.key==='Enter') run() }

  return (
    <div style={{display:'flex',gap:8}}>
      <input
        value={cmd}
        onChange={e=>setCmd(e.target.value)}
        onKeyDown={onKey}
        placeholder='Type a command… e.g. "open payroll"'
        style={{flex:1,padding:'10px 12px',border:'1px solid #ddd',borderRadius:8}}
      />
      <button onClick={run} disabled={loading} style={{padding:'10px 14px',borderRadius:8}}>
        {loading?'…':'Go'}
      </button>
      {err && <div style={{marginLeft:12,color:'#b00'}}>{err}</div>}
    </div>
  )
}
