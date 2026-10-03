import { ReactNode, useEffect, useState } from "react"
import { ArrowRight, BarChart3, Building2, CalendarDays, Database, Home, Landmark, Lightbulb, Loader2, MapPin, Moon, RotateCcw, ShieldCheck, Sparkles, Star, Users, Zap } from "lucide-react"
import { PredictRequest, PredictResponse } from "./types/api"
import { checkHealth, getMetadata, predict } from "./services/api"
import "./App.css"

const EXAMPLE: PredictRequest = { latitude: 40.75362, longitude: -73.98377, price: 150, minimum_nights: 3, number_of_reviews: 45, reviews_per_month: 1.2, calculated_host_listings_count: 2, availability_365: 200, neighbourhood_group: "Manhattan", neighbourhood: "Midtown" }
const GROUPS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const
const CLASS_COLOR: Record<string, string> = { "Entire home/apt": "#ffc629", "Private room": "#91a4bd", "Shared room": "#596a80" }

export default function App() {
  const [form, setForm] = useState<PredictRequest>(EXAMPLE)
  const [errors, setErrors] = useState<Partial<Record<keyof PredictRequest, string>>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [health, setHealth] = useState<"online" | "offline" | "checking">("checking")
  const [metadata, setMetadata] = useState<any>(null)

  const fetchStatus = async () => {
    try { setHealth("checking"); await checkHealth(); setMetadata(await getMetadata().catch(() => null)); setHealth("online") } catch { setHealth("offline") }
  }
  useEffect(() => { fetchStatus(); const id = setInterval(fetchStatus, 30000); return () => clearInterval(id) }, [])

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof PredictRequest, string>> = {}
    if (form.latitude < 40 || form.latitude > 41.5) nextErrors.latitude = "Use 40.0 - 41.5"
    if (form.longitude < -74.3 || form.longitude > -73.5) nextErrors.longitude = "Use -74.3 - -73.5"
    if (form.price <= 0 || form.price > 10000) nextErrors.price = "Use 1 - 10,000"
    if (!Number.isInteger(form.minimum_nights) || form.minimum_nights < 1) nextErrors.minimum_nights = "Minimum 1 night"
    if (form.number_of_reviews < 0) nextErrors.number_of_reviews = "Cannot be negative"
    if (form.reviews_per_month < 0) nextErrors.reviews_per_month = "Cannot be negative"
    if (form.calculated_host_listings_count < 1) nextErrors.calculated_host_listings_count = "Minimum 1"
    if (form.availability_365 < 0 || form.availability_365 > 365) nextErrors.availability_365 = "Use 0 - 365"
    if (!form.neighbourhood.trim()) nextErrors.neighbourhood = "Required"
    setErrors(nextErrors); return Object.keys(nextErrors).length === 0
  }

  const handlePredict = async () => {
    setApiError(null); if (!validate()) return; setLoading(true); setResult(null)
    try { setResult(await predict(form)) } catch (error: any) {
      if (error.status === 422) setApiError("Invalid input. Check the highlighted fields.")
      else if (error.status === 503) setApiError("Model is warming up. Try again in a moment.")
      else if (error.message?.includes("Failed to fetch")) setApiError(`Backend offline at ${import.meta.env.VITE_API_BASE_URL}`)
      else setApiError(error.message || "Unexpected error")
    } finally { setLoading(false) }
  }
  const handleClear = () => { setForm({ latitude: 0, longitude: 0, price: 0, minimum_nights: 1, number_of_reviews: 0, reviews_per_month: 0, calculated_host_listings_count: 1, availability_365: 0, neighbourhood_group: "Manhattan", neighbourhood: "" }); setResult(null); setErrors({}); setApiError(null) }
  const update = (key: keyof PredictRequest, value: any) => setForm((current) => ({ ...current, [key]: value }))
  const confidenceDegrees = result ? result.confidence * 360 : 0

  return <div className="app-shell">
    <div className="city-glow" />
    <header className="topbar"><div className="topbar-inner">
      <div className="brand-lockup"><div className="brand-mark"><Landmark size={17} /></div><div><span>NYC Room Classifier</span><small>Short-term rental room classification</small></div></div>
    </div></header>

    <main id="predict" className="page-shell">
      <section className="hero"><div className="hero-copy"><h1>Classify any <em>NYC listing</em></h1><p>Enter 10 listing features and get an instant prediction of whether the listing is an <strong>Entire home/apt</strong>, <strong>Private room</strong>, or <strong>Shared room</strong>.</p></div><div className="hero-metrics"><Metric icon={<Home size={15} />} value="3" label="Room types" detail="Entire · Private · Shared" tone="gold" /><Metric icon={<Database size={15} />} value="10" label="Input features" detail="Location · Pricing · Stay" tone="blue" /><Metric icon={<Zap size={15} />} value="Live API" label="Real-time inference" detail="Fast & reliable" tone="yellow" /></div></section>

      <section className="workspace-grid">
        <section className="panel input-panel" onKeyDown={(event) => { if (event.key === "Enter" && !loading) { event.preventDefault(); void handlePredict() } }}>
          <div className="panel-heading"><div className="panel-title"><span className="panel-icon yellow"><Database size={15} /></span><div><h2>Listing features</h2><p>Enter the 10 features of the listing to get a prediction</p></div></div><button className="load-example" type="button" onClick={() => { setForm(EXAMPLE); setErrors({}); setApiError(null) }}><Sparkles size={13} /> Load example</button></div>
          {apiError && <div className="dark-alert">{apiError}</div>}{health === "offline" && <div className="dark-alert">Backend is offline. Start the FastAPI server on port 8000.</div>}
          <FormSection icon={<MapPin size={12} />} title="Location & Neighbourhood"><Field label="Latitude" required error={errors.latitude}><div className="control with-icon"><MapPin size={13} /><NumberInput value={form.latitude} step="0.00001" onChange={(v) => update("latitude", v)} /><span>°N</span></div></Field><Field label="Longitude" required error={errors.longitude}><div className="control with-icon"><MapPin size={13} /><NumberInput value={form.longitude} step="0.00001" onChange={(v) => update("longitude", v)} /><span>°W</span></div></Field><Field label="Neighbourhood group" required error={errors.neighbourhood_group}><select value={form.neighbourhood_group} onChange={(event) => update("neighbourhood_group", event.target.value)}>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select></Field><Field label="Neighbourhood" required error={errors.neighbourhood}><div className="control with-icon"><MapPin size={13} /><input value={form.neighbourhood} placeholder="Midtown" onChange={(event) => update("neighbourhood", event.target.value)} /></div></Field></FormSection>
          <FormSection icon={<span className="section-symbol">$</span>} title="Pricing & Stay"><Field label="Price per night" required error={errors.price}><div className="control with-prefix"><b>$</b><NumberInput value={form.price} onChange={(v) => update("price", v)} /></div></Field><Field label="Minimum nights" required error={errors.minimum_nights}><div className="control with-icon"><Moon size={13} /><NumberInput value={form.minimum_nights} onChange={(v) => update("minimum_nights", Math.round(v))} /></div></Field><Field className="wide" label="Availability" hint="days/year" error={errors.availability_365}><div className="control with-icon"><CalendarDays size={13} /><NumberInput value={form.availability_365} onChange={(v) => update("availability_365", Math.round(v))} /><span>/365 days</span></div></Field></FormSection>
          <FormSection icon={<Star size={12} />} title="Host Performance"><Field label="Number of reviews" error={errors.number_of_reviews}><div className="control with-icon"><Star size={13} /><NumberInput value={form.number_of_reviews} onChange={(v) => update("number_of_reviews", Math.round(v))} /></div></Field><Field label="Reviews per month" error={errors.reviews_per_month}><div className="control with-icon"><BarChart3 size={13} /><NumberInput value={form.reviews_per_month} step="0.1" onChange={(v) => update("reviews_per_month", v)} /></div></Field><Field className="wide" label="Host listings count" error={errors.calculated_host_listings_count}><div className="control with-icon"><Users size={13} /><NumberInput value={form.calculated_host_listings_count} onChange={(v) => update("calculated_host_listings_count", Math.round(v))} /></div></Field></FormSection>
          <div className="form-actions"><button className="classify-button" type="button" onClick={handlePredict} disabled={loading}>{loading ? <><Loader2 size={16} className="spin" /> Analyzing...</> : <><Sparkles size={16} /> Run classification <ArrowRight size={15} /></>}</button><button className="reset-button" type="button" onClick={handleClear}><RotateCcw size={14} /> Clear</button></div><p className="privacy-note"><ShieldCheck size={12} /> Target <code>room_type</code> is never sent to the model.</p>
        </section>

        <section className="panel result-panel"><div className="panel-heading result-heading"><div className="panel-title"><span className="panel-icon yellow"><BarChart3 size={15} /></span><div><h2>Prediction result</h2><p>Model prediction and class probabilities</p></div></div></div>
          {!result && !loading && <EmptyResult />}{loading && <div className="result-loading"><div /><div /><div /><div /></div>}{result && !loading && <div className="result-body"><div className="result-highlight"><div className="result-label"><span className="result-home"><Home size={19} /></span><div><small>Predicted room type</small><h3>{result.room_type}</h3><p>This listing is most likely classified as {result.room_type.toLowerCase()}.</p></div></div><div className="confidence-ring" style={{ background: `conic-gradient(#ffc629 ${confidenceDegrees}deg, #253143 0deg)` }}><div><b>{Math.round(result.confidence * 100)}%</b><span>Confidence</span></div></div></div><div className="probability-box"><div className="box-label">Class probabilities</div>{Object.entries(result.probabilities).map(([label, probability]) => <div className="probability-row" key={label}><div><span className="prob-dot" style={{ background: CLASS_COLOR[label] }} />{label}</div><span>{Math.round(probability * 100)}%</span><div className="probability-track"><i style={{ width: `${probability * 100}%`, background: CLASS_COLOR[label] }} /></div></div>)}</div><div className="context-grid"><div className="context-box"><div className="box-label"><Lightbulb size={13} /> Input snapshot</div><div className="signal"><span>Price per night</span><b>${form.price}</b></div><div className="signal"><span>Minimum nights</span><b>{form.minimum_nights}</b></div><div className="signal"><span>Reviews / month</span><b>{form.reviews_per_month}</b></div><div className="signal"><span>Availability</span><b>{form.availability_365} days</b></div></div><div className="context-box location-box"><div className="box-label"><MapPin size={13} /> Location context</div><div className="mini-map"><span className="map-pin"><MapPin size={16} /></span></div><strong>{form.neighbourhood_group}</strong><small>{form.neighbourhood}</small></div></div></div>}
        </section>
      </section><footer className="footer"><span>NYC Room Classifier</span><span>Model inference via <code>POST /predict</code></span><span>{metadata?.model_file || "Model_Pipeline.pkl"}</span></footer>
    </main>
  </div>
}

function Metric({ icon, value, label, detail, tone }: { icon: ReactNode; value: string; label: string; detail: string; tone: string }) { return <div className={`metric ${tone}`}><span className="metric-icon">{icon}</span><b>{value}</b><span>{label}</span><small>{detail}</small></div> }
function FormSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) { return <div className="form-section"><div className="form-section-title">{icon}<span>{title}</span></div><div className="fields-grid">{children}</div></div> }
function Field({ label, required, hint, error, className = "", children }: { label: string; required?: boolean; hint?: string; error?: string; className?: string; children: ReactNode }) { return <div className={`field ${className}`}><label>{label} {required && <em>*</em>} {hint && <small>{hint}</small>}</label>{children}{error && <span className="field-error">{error}</span>}</div> }
function NumberInput({ value, step = "1", onChange }: { value: number; step?: string; onChange: (value: number) => void }) { return <input type="number" value={value} step={step} onChange={(event) => onChange(Number(event.target.value) || 0)} /> }
function EmptyResult() { return <div className="empty-result"><div className="empty-map"><div className="map-lines" /><Building2 size={28} /><span>NYC · 5 BOROUGHS</span></div><h3>Awaiting prediction</h3><p>Complete the listing features and run the classifier. Your result will appear here with confidence and probability breakdown.</p><div className="legend"><span><i className="gold-dot" /> Entire home/apt</span><span><i className="blue-dot" /> Private room</span><span><i className="slate-dot" /> Shared room</span></div></div> }