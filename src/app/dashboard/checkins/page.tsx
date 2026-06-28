'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/checkins').then(r => r.json()).then(d => { setCheckIns(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = checkIns.filter(ci => {
    if (filter === 'sent' && !ci.sentViaWA) return false
    if (filter === 'draft' && ci.sentViaWA) return false
    if (search && !ci.trip?.coupleNames?.toLowerCase().includes(search.toLowerCase()) && !ci.trip?.destination?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sentCount = checkIns.filter(c => c.sentViaWA).length

  const cardStyle = (ci: any): React.CSSProperties => ({
    background: selected?.id === ci.id ? 'var(--accent-light)' : 'var(--surface)',
    border: `1px solid ${selected?.id === ci.id ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: '0.875rem 1rem',
    cursor: 'pointer',
  })

  return (
    <div style={{padding:'2rem',maxWidth:'1200px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--accent)',fontWeight:600,marginBottom:'4px'}}>Trip Managers</div>
          <h1 style={{fontSize:'26px',fontWeight:500,fontFamily:'Georgia,serif',marginBottom:'4px'}}>Check-in History</h1>
          <p style={{fontSize:'14px',color:'var(--text2)'}}>All WhatsApp check-ins sent to couples</p>
        </div>
        <div style={{display:'flex',gap:'1.5rem'}}>
          {[{v:checkIns.length,l:'Total'},{v:sentCount,l:'Sent',c:'var(--teal)'},{v:checkIns.length-sentCount,l:'Drafts',c:'var(--amber)'}].map((s,i) => (
            <div key={i} style={{textAlign:'right'}}>
              <div style={{fontSize:'20px',fontWeight:500,color:s.c||'var(--text)'}}>{s.v}</div>
              <div style={{fontSize:'11px',color:'var(--text3)'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'1.25rem'}}>
        <input style={{flex:1,padding:'9px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',fontSize:'13px',color:'var(--text)',outline:'none',fontFamily:'inherit'}} placeholder="Search by couple name or destination..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={{display:'flex',gap:'6px'}}>
          {['all','sent','draft'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'7px 14px',background:filter===f?'var(--accent)':'var(--surface)',border:'1px solid',borderColor:filter===f?'var(--accent)':'var(--border)',borderRadius:'20px',fontSize:'12px',color:filter===f?'white':'var(--text2)',cursor:'pointer',fontFamily:'inherit'}}>
              {f==='all'?`All (${checkIns.length})`:f==='sent'?`Sent (${sentCount})`:`Draft (${checkIns.length-sentCount})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:'1.25rem',height:'calc(100vh - 300px)'}}>
        <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px'}}>
          {loading && <div style={{padding:'2rem',textAlign:'center',color:'var(--text2)'}}>Loading...</div>}
          {!loading && filtered.length === 0 && <div style={{padding:'2rem',textAlign:'center',color:'var(--text2)'}}>No check-ins found</div>}
          {filtered.map(ci => (
            <div key={ci.id} onClick={()=>setSelected(ci)} style={cardStyle(ci)}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <div>
                  <div style={{fontSize:'13px',fontWeight:500}}>{ci.trip?.coupleNames}</div>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>{ci.trip?.destination}</div>
                </div>
                <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'20px',background:ci.sentViaWA?'var(--teal-light)':'var(--surface2)',color:ci.sentViaWA?'var(--teal)':'var(--text3)'}}>{ci.sentViaWA?'✓ Sent':'Draft'}</span>
              </div>
              <div style={{fontSize:'12px',color:'var(--text2)',lineHeight:1.5,marginBottom:'6px'}}>{ci.message?.slice(0,90)}...</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--text3)'}}>
                <span>{ci.todayEvent}</span>
                <span>{new Date(ci.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflowY:'auto'}}>
          {!selected ? (
            <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:'13px'}}>Select a check-in to view details</div>
          ) : (
            <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:'1rem',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:'18px',fontWeight:500,fontFamily:'Georgia,serif'}}>{selected.trip?.coupleNames}</div>
                  <div style={{fontSize:'13px',color:'var(--text2)',marginTop:'3px'}}>{selected.trip?.destination} · {selected.trip?.hotel}</div>
                </div>
                <Link href={`/dashboard/trips/${selected.trip?.id}`} style={{fontSize:'12px',color:'var(--accent)',padding:'6px 12px',border:'1px solid var(--accent)',borderRadius:'var(--radius)',textDecoration:'none'}}>View trip →</Link>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {[['Mood',selected.moodSignal],['Event',selected.todayEvent],['Language',selected.language],['Status',selected.sentViaWA?'✓ Sent':'Draft'],['By',selected.author?.name||selected.author?.email],['Date',new Date(selected.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})]].map(([l,v])=>(
                  <div key={String(l)} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'0.625rem 0.875rem'}}>
                    <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'3px'}}>{l}</div>
                    <div style={{fontSize:'13px',fontWeight:500}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'1rem'}}>
                <div style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text3)',marginBottom:'8px'}}>Message sent</div>
                <div style={{fontSize:'13px',lineHeight:1.7,borderLeft:'3px solid var(--accent)',paddingLeft:'12px',whiteSpace:'pre-wrap'}}>{selected.message}</div>
                <button onClick={()=>navigator.clipboard.writeText(selected.message)} style={{marginTop:'10px',padding:'6px 12px',background:'none',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'11px',color:'var(--text2)',cursor:'pointer',fontFamily:'inherit'}}>⎘ Copy</button>
              </div>

              {selected.actions?.length > 0 && (
                <div>
                  <div style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--text3)',marginBottom:'8px'}}>Actions ({selected.actions.length})</div>
                  {selected.actions.map((a:any) => (
                    <div key={a.id} style={{display:'flex',gap:'8px',alignItems:'center',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:'13px',opacity:a.completed?0.5:1}}>
                      <span style={{fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'4px',background:a.priority==='HIGH'?'var(--red-light)':a.priority==='MEDIUM'?'var(--amber-light)':'var(--teal-light)',color:a.priority==='HIGH'?'var(--red)':a.priority==='MEDIUM'?'var(--amber)':'var(--teal)'}}>{a.priority}</span>
                      <span style={{flex:1}}>{a.text}</span>
                      {a.completed && <span style={{color:'var(--teal)'}}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
