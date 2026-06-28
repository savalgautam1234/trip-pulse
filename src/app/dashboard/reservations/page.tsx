'use client'
import { useState } from 'react'
import styles from './reservations.module.css'

const DESTINATIONS = ['Bali, Indonesia', 'Maldives', 'Vietnam · Da Nang', 'Thailand · Phuket', 'Sri Lanka', 'New Zealand', 'Japan · Tokyo', 'Europe · Paris', 'Dubai, UAE', 'Singapore']
const BUDGETS = ['₹50,000 – ₹1L', '₹1L – ₹2L', '₹2L – ₹3L', '₹3L – ₹5L', '₹5L+']
const VIBES = ['Beach & Relaxation', 'Adventure & Trekking', 'Culture & Heritage', 'Luxury & Spa', 'Food & Nightlife', 'Honeymoon Romance']

interface ReservationResult {
  flights: { airline: string; departure: string; arrival: string; price: string; duration: string; stops: string }[]
  hotels: { name: string; stars: number; location: string; pricePerNight: string; highlights: string[]; rating: string }[]
  activities: { name: string; duration: string; price: string; description: string; bestFor: string }[]
  visaInfo: { required: boolean; type: string; processingTime: string; cost: string; documents: string[] }
  totalEstimate: string
  travelTips: string[]
}

export default function ReservationsPage() {
  const [form, setForm] = useState({ destination: '', departureCity: '', startDate: '', endDate: '', budget: '', vibe: '', adults: '2', notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'activities' | 'visa'>('flights')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function generate() {
    if (!form.destination || !form.departureCity || !form.startDate || !form.endDate || !form.budget) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setActiveTab('flights')
    } catch (e: any) {
      setError(e.message || 'Failed to generate recommendations')
    }
    setLoading(false)
  }

  const nights = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)
    : 0

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>AI-powered</div>
          <h1 className={styles.title}>Reservations Planner</h1>
          <p className={styles.sub}>Generate complete flight, hotel & activity packages in seconds</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}><span>2,000+</span><label>trips planned</label></div>
          <div className={styles.stat}><span>15 min</span><label>avg saved per booking</label></div>
          <div className={styles.stat}><span>98%</span><label>accuracy rate</label></div>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formTitle}>Trip details</div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Destination <span className={styles.req}>*</span></label>
                <select value={form.destination} onChange={set('destination')}>
                  <option value="">Select destination</option>
                  {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Departure city <span className={styles.req}>*</span></label>
                <input type="text" value={form.departureCity} onChange={set('departureCity')} placeholder="e.g. Mumbai, Delhi" />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Start date <span className={styles.req}>*</span></label>
                <input type="date" value={form.startDate} onChange={set('startDate')} />
              </div>
              <div className={styles.field}>
                <label>End date <span className={styles.req}>*</span></label>
                <input type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>

            {nights > 0 && <div className={styles.nightsBadge}>✦ {nights} nights · {nights + 1} days</div>}

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Budget per couple <span className={styles.req}>*</span></label>
                <select value={form.budget} onChange={set('budget')}>
                  <option value="">Select budget</option>
                  {BUDGETS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Number of adults</label>
                <select value={form.adults} onChange={set('adults')}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Trip vibe</label>
              <div className={styles.vibeGrid}>
                {VIBES.map(v => (
                  <button key={v} className={`${styles.vibeBtn} ${form.vibe === v ? styles.vibeActive : ''}`} onClick={() => setForm(p => ({ ...p, vibe: v }))}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Special requests or notes</label>
              <textarea value={form.notes} onChange={set('notes')} placeholder="e.g. window seats preferred, no spicy food, anniversary trip..." rows={3} />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.genBtn} onClick={generate} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Generating package...</> : '✦ Generate reservation package'}
            </button>
          </div>
        </div>

        <div className={styles.resultPanel}>
          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✈</div>
              <div className={styles.emptyTitle}>Your package will appear here</div>
              <div className={styles.emptySub}>Fill in the trip details and click generate to get AI-curated flights, hotels, activities and visa info</div>
              <div className={styles.emptyFeatures}>
                <div>✓ Real airline recommendations</div>
                <div>✓ Curated hotel options by budget</div>
                <div>✓ Activity bundles</div>
                <div>✓ Visa requirements</div>
                <div>✓ Travel tips</div>
              </div>
            </div>
          )}

          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingPulse} />
              <div className={styles.loadingText}>Generating your package...</div>
              <div className={styles.loadingSteps}>
                <div className={styles.loadingStep}>✓ Checking flight routes</div>
                <div className={styles.loadingStep}>✓ Curating hotels</div>
                <div className={styles.loadingStep}>✓ Finding activities</div>
                <div className={styles.loadingStep}>◦ Verifying visa info...</div>
              </div>
            </div>
          )}

          {result && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <div>
                  <div className={styles.resultTitle}>{form.destination}</div>
                  <div className={styles.resultMeta}>{form.departureCity} · {nights} nights · {form.budget}</div>
                </div>
                <div className={styles.totalEstimate}>
                  <div className={styles.totalLabel}>Est. total</div>
                  <div className={styles.totalValue}>{result.totalEstimate}</div>
                </div>
              </div>

              <div className={styles.tabs}>
                {(['flights', 'hotels', 'activities', 'visa'] as const).map(tab => (
                  <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'flights' ? '✈ Flights' : tab === 'hotels' ? '🏨 Hotels' : tab === 'activities' ? '🎯 Activities' : '📋 Visa'}
                  </button>
                ))}
              </div>

              {activeTab === 'flights' && (
                <div className={styles.cards}>
                  {result.flights.map((f, i) => (
                    <div key={i} className={styles.flightCard}>
                      <div className={styles.flightTop}>
                        <div className={styles.airline}>{f.airline}</div>
                        <div className={styles.flightPrice}>{f.price}</div>
                      </div>
                      <div className={styles.flightRoute}>
                        <div className={styles.flightTime}>{f.departure}</div>
                        <div className={styles.flightDuration}>{f.duration} · {f.stops}</div>
                        <div className={styles.flightTime}>{f.arrival}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'hotels' && (
                <div className={styles.cards}>
                  {result.hotels.map((h, i) => (
                    <div key={i} className={styles.hotelCard}>
                      <div className={styles.hotelTop}>
                        <div>
                          <div className={styles.hotelName}>{h.name}</div>
                          <div className={styles.hotelLocation}>📍 {h.location}</div>
                          <div className={styles.stars}>{'★'.repeat(h.stars)}{'☆'.repeat(5 - h.stars)}</div>
                        </div>
                        <div className={styles.hotelPrice}>
                          <div className={styles.hotelPriceNum}>{h.pricePerNight}</div>
                          <div className={styles.hotelPriceLabel}>per night</div>
                          <div className={styles.hotelRating}>⭐ {h.rating}</div>
                        </div>
                      </div>
                      <div className={styles.highlights}>
                        {h.highlights.map((hl, j) => <span key={j} className={styles.highlight}>{hl}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className={styles.cards}>
                  {result.activities.map((a, i) => (
                    <div key={i} className={styles.activityCard}>
                      <div className={styles.activityTop}>
                        <div className={styles.activityName}>{a.name}</div>
                        <div className={styles.activityPrice}>{a.price}</div>
                      </div>
                      <div className={styles.activityDesc}>{a.description}</div>
                      <div className={styles.activityMeta}>
                        <span>⏱ {a.duration}</span>
                        <span>👥 {a.bestFor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'visa' && (
                <div className={styles.visaCard}>
                  <div className={styles.visaHeader}>
                    <div className={`${styles.visaBadge} ${result.visaInfo.required ? styles.visaRequired : styles.visaFree}`}>
                      {result.visaInfo.required ? '⚠ Visa Required' : '✓ Visa Free'}
                    </div>
                    <div className={styles.visaType}>{result.visaInfo.type}</div>
                  </div>
                  <div className={styles.visaDetails}>
                    <div className={styles.visaDetail}><label>Processing time</label><span>{result.visaInfo.processingTime}</span></div>
                    <div className={styles.visaDetail}><label>Cost</label><span>{result.visaInfo.cost}</span></div>
                  </div>
                  <div className={styles.visaDocs}>
                    <div className={styles.visaDocsTitle}>Required documents</div>
                    {result.visaInfo.documents.map((d, i) => <div key={i} className={styles.visaDoc}>✓ {d}</div>)}
                  </div>
                </div>
              )}

              <div className={styles.tipsBox}>
                <div className={styles.tipsTitle}>✦ Travel tips</div>
                {result.travelTips.map((t, i) => <div key={i} className={styles.tip}>• {t}</div>)}
              </div>

              <button className={styles.exportBtn} onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>
                ⎘ Copy package details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
