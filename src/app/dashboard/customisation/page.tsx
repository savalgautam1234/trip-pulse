'use client'
import { useState } from 'react'
import styles from './customisation.module.css'

const TRIP_TYPES = ['Honeymoon', 'Anniversary', 'Birthday getaway', 'First international trip', 'Babymoon', 'Leisure vacation']
const INTERESTS = ['Beach & Water sports', 'Hiking & Nature', 'Local cuisine & Food tours', 'Art & Museums', 'Nightlife & Parties', 'Wellness & Spa', 'Shopping', 'Photography spots']
const CONCERNS = ['Vegetarian food availability', 'Language barrier', 'Safety for couples', 'Budget management', 'Medical facilities', 'Connectivity & SIM', 'Currency exchange']

interface CustomisationResult {
  firstCallScript: {
    greeting: string
    itineraryWalkthrough: string[]
    keyHighlights: string[]
    thingsToDiscuss: string[]
    closing: string
  }
  itinerarySuggestions: {
    day: number
    title: string
    morning: string
    afternoon: string
    evening: string
    tip: string
  }[]
  visaChecklist: {
    item: string
    status: 'required' | 'optional' | 'info'
    details: string
  }[]
  changeRecommendations: {
    current: string
    suggested: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }[]
  packingList: string[]
  coupleNotes: string
}

export default function CustomisationPage() {
  const [form, setForm] = useState({
    coupleNames: '', destination: '', startDate: '', endDate: '',
    tripType: '', interests: [] as string[], concerns: [] as string[],
    currentItinerary: '', specialOccasion: '', dietaryReqs: '', budget: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CustomisationResult | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'script' | 'itinerary' | 'visa' | 'changes' | 'packing'>('script')
  const [copied, setCopied] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const toggleInterest = (i: string) => setForm(p => ({
    ...p, interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i]
  }))

  const toggleConcern = (c: string) => setForm(p => ({
    ...p, concerns: p.concerns.includes(c) ? p.concerns.filter(x => x !== c) : [...p.concerns, c]
  }))

  async function generate() {
    if (!form.coupleNames || !form.destination || !form.startDate) {
      setError('Please fill in couple names, destination and start date')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/customisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setActiveTab('script')
    } catch (e: any) {
      setError(e.message || 'Failed to generate')
    }
    setLoading(false)
  }

  function copyScript() {
    if (!result) return
    const script = `FIRST CALL SCRIPT — ${form.coupleNames} — ${form.destination}\n\n${result.firstCallScript.greeting}\n\n${result.firstCallScript.itineraryWalkthrough.join('\n')}\n\nKey highlights:\n${result.firstCallScript.keyHighlights.map(h => '• ' + h).join('\n')}\n\nDiscuss:\n${result.firstCallScript.thingsToDiscuss.map(t => '• ' + t).join('\n')}\n\n${result.firstCallScript.closing}`
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nights = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)
    : 0

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>AI-powered</div>
          <h1 className={styles.title}>Customisation Manager</h1>
          <p className={styles.sub}>First-call scripts, itinerary refinements, visa checklists & more</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}><span>30 min</span><label>saved per call</label></div>
          <div className={styles.stat}><span>95%</span><label>customer satisfaction</label></div>
          <div className={styles.stat}><span>D-45</span><label>to D-7 coverage</label></div>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formTitle}>Couple & trip details</div>

            <div className={styles.field}>
              <label>Couple names <span className={styles.req}>*</span></label>
              <input type="text" value={form.coupleNames} onChange={set('coupleNames')} placeholder="e.g. Priya & Arjun Mehta" />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Destination <span className={styles.req}>*</span></label>
                <input type="text" value={form.destination} onChange={set('destination')} placeholder="e.g. Bali, Indonesia" />
              </div>
              <div className={styles.field}>
                <label>Trip type</label>
                <select value={form.tripType} onChange={set('tripType')}>
                  <option value="">Select type</option>
                  {TRIP_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Start date <span className={styles.req}>*</span></label>
                <input type="date" value={form.startDate} onChange={set('startDate')} />
              </div>
              <div className={styles.field}>
                <label>End date</label>
                <input type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>

            {nights > 0 && <div className={styles.nightsBadge}>✦ {nights} nights · {nights + 1} days</div>}

            <div className={styles.field}>
              <label>Interests (select all that apply)</label>
              <div className={styles.tagGrid}>
                {INTERESTS.map(i => (
                  <button key={i} className={`${styles.tag} ${form.interests.includes(i) ? styles.tagActive : ''}`} onClick={() => toggleInterest(i)}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Customer concerns</label>
              <div className={styles.tagGrid}>
                {CONCERNS.map(c => (
                  <button key={c} className={`${styles.tag} ${form.concerns.includes(c) ? styles.tagActive : ''}`} onClick={() => toggleConcern(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Current itinerary (paste or describe)</label>
              <textarea value={form.currentItinerary} onChange={set('currentItinerary')} placeholder="Day 1: Arrival at Bali, check-in at The Layar...\nDay 2: Ubud tour..." rows={4} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Special occasion</label>
                <input type="text" value={form.specialOccasion} onChange={set('specialOccasion')} placeholder="e.g. 5th anniversary" />
              </div>
              <div className={styles.field}>
                <label>Dietary requirements</label>
                <input type="text" value={form.dietaryReqs} onChange={set('dietaryReqs')} placeholder="e.g. vegetarian, no seafood" />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.genBtn} onClick={generate} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Preparing call pack...</> : '✦ Generate customisation pack'}
            </button>
          </div>
        </div>

        <div className={styles.resultPanel}>
          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <div className={styles.emptyTitle}>Your customisation pack will appear here</div>
              <div className={styles.emptySub}>Fill in the couple's details to generate a complete call prep package</div>
              <div className={styles.emptyFeatures}>
                <div>✓ Personalised first-call script</div>
                <div>✓ Day-by-day itinerary walkthrough</div>
                <div>✓ Visa & document checklist</div>
                <div>✓ Change recommendations</div>
                <div>✓ Packing list</div>
              </div>
            </div>
          )}

          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingPulse} />
              <div className={styles.loadingText}>Preparing call pack for {form.coupleNames || 'couple'}...</div>
              <div className={styles.loadingSteps}>
                <div>✓ Personalising script</div>
                <div>✓ Building itinerary</div>
                <div>✓ Checking visa requirements</div>
                <div>◦ Finalising recommendations...</div>
              </div>
            </div>
          )}

          {result && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <div>
                  <div className={styles.resultTitle}>{form.coupleNames}</div>
                  <div className={styles.resultMeta}>{form.destination} · {form.tripType || 'Trip'} · {nights > 0 ? `${nights} nights` : form.startDate}</div>
                </div>
                <div className={styles.coupleNote}>{result.coupleNotes}</div>
              </div>

              <div className={styles.tabs}>
                {(['script', 'itinerary', 'visa', 'changes', 'packing'] as const).map(tab => (
                  <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'script' ? '📞 Call script' : tab === 'itinerary' ? '🗓 Itinerary' : tab === 'visa' ? '📋 Visa' : tab === 'changes' ? '✏ Changes' : '🧳 Packing'}
                  </button>
                ))}
              </div>

              {activeTab === 'script' && (
                <div className={styles.scriptPanel}>
                  <div className={styles.scriptSection}>
                    <div className={styles.scriptLabel}>Opening</div>
                    <div className={styles.scriptText}>{result.firstCallScript.greeting}</div>
                  </div>
                  <div className={styles.scriptSection}>
                    <div className={styles.scriptLabel}>Itinerary walkthrough</div>
                    {result.firstCallScript.itineraryWalkthrough.map((line, i) => (
                      <div key={i} className={styles.scriptLine}>{line}</div>
                    ))}
                  </div>
                  <div className={styles.scriptSection}>
                    <div className={styles.scriptLabel}>Key highlights to mention</div>
                    {result.firstCallScript.keyHighlights.map((h, i) => (
                      <div key={i} className={styles.highlight}>⭐ {h}</div>
                    ))}
                  </div>
                  <div className={styles.scriptSection}>
                    <div className={styles.scriptLabel}>Things to discuss</div>
                    {result.firstCallScript.thingsToDiscuss.map((t, i) => (
                      <div key={i} className={styles.discussItem}>❓ {t}</div>
                    ))}
                  </div>
                  <div className={styles.scriptSection}>
                    <div className={styles.scriptLabel}>Closing</div>
                    <div className={styles.scriptText}>{result.firstCallScript.closing}</div>
                  </div>
                  <button className={styles.copyBtn} onClick={copyScript}>
                    {copied ? '✓ Copied!' : '⎘ Copy full script'}
                  </button>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className={styles.itineraryPanel}>
                  {result.itinerarySuggestions.map((day, i) => (
                    <div key={i} className={styles.dayCard}>
                      <div className={styles.dayHeader}>
                        <div className={styles.dayNum}>Day {day.day}</div>
                        <div className={styles.dayTitle}>{day.title}</div>
                      </div>
                      <div className={styles.daySlots}>
                        <div className={styles.daySlot}><span className={styles.slotLabel}>Morning</span><span>{day.morning}</span></div>
                        <div className={styles.daySlot}><span className={styles.slotLabel}>Afternoon</span><span>{day.afternoon}</span></div>
                        <div className={styles.daySlot}><span className={styles.slotLabel}>Evening</span><span>{day.evening}</span></div>
                      </div>
                      <div className={styles.dayTip}>💡 {day.tip}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'visa' && (
                <div className={styles.visaPanel}>
                  {result.visaChecklist.map((item, i) => (
                    <div key={i} className={styles.visaItem}>
                      <div className={`${styles.visaStatus} ${styles[item.status]}`}>
                        {item.status === 'required' ? '!' : item.status === 'optional' ? '?' : 'i'}
                      </div>
                      <div>
                        <div className={styles.visaItemName}>{item.item}</div>
                        <div className={styles.visaItemDetail}>{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'changes' && (
                <div className={styles.changesPanel}>
                  {result.changeRecommendations.map((c, i) => (
                    <div key={i} className={styles.changeCard}>
                      <div className={`${styles.changePriority} ${styles[c.priority]}`}>{c.priority.toUpperCase()}</div>
                      <div className={styles.changeContent}>
                        <div className={styles.changeCurrent}>Current: {c.current}</div>
                        <div className={styles.changeSuggested}>→ Suggested: {c.suggested}</div>
                        <div className={styles.changeReason}>{c.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'packing' && (
                <div className={styles.packingPanel}>
                  <div className={styles.packingGrid}>
                    {result.packingList.map((item, i) => (
                      <div key={i} className={styles.packingItem}>
                        <input type="checkbox" id={`pack-${i}`} />
                        <label htmlFor={`pack-${i}`}>{item}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
