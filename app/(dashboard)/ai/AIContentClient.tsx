'use client'

import { useState, useTransition } from 'react'
import {
  Sparkles,
  Camera,
  Globe,
  Music2,
  Smile,
  Briefcase,
  Flame,
  Copy,
  Check,
  Loader2,
  Hash,
  Type,
  FileText,
  Palette,
  Clock,
} from 'lucide-react'
import {
  generateContent,
  type Platform,
  type Tone,
  type GeneratedContent,
} from './actions'

/* ─── Options ───────────────────────────────────────────────────────────── */

const PLATFORMS: { value: Platform; label: string; icon: typeof Camera }[] = [
  { value: 'instagram', label: 'Instagram', icon: Camera },
  { value: 'linkedin', label: 'LinkedIn', icon: Globe },
  { value: 'tiktok', label: 'TikTok', icon: Music2 },
]

const TONES: { value: Tone; label: string; icon: typeof Smile }[] = [
  { value: 'casual', label: 'Casual', icon: Smile },
  { value: 'professional', label: 'Profesional', icon: Briefcase },
  { value: 'motivational', label: 'Motivacional', icon: Flame },
]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function AIContentClient() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [tone, setTone] = useState<Tone>('casual')
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    if (!topic.trim() || topic.trim().length < 3) return
    setError(null)
    setResult(null)

    startTransition(async () => {
      const res = await generateContent(topic.trim(), platform, tone)
      if (!res.success) {
        setError(res.error || 'Error desconocido.')
      } else {
        setResult(res.data!)
      }
    })
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="ai-gen">
      {/* ── Left: Form ────────────────────────────────────── */}
      <div className="ai-gen-form-card">
        <div className="ai-gen-form-header">
          <div className="ai-gen-icon-wrap">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="ai-gen-form-title">Generador de Contenido</h2>
            <p className="ai-gen-form-subtitle">
              Crea contenido viral para redes sociales con IA
            </p>
          </div>
        </div>

        {/* Topic */}
        <div className="ai-field">
          <label className="ai-field-label" htmlFor="ai-topic">
            Tema del contenido
          </label>
          <input
            id="ai-topic"
            className="ai-field-input"
            placeholder="Ej: Inteligencia Artificial en la educación"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isPending}
          />
        </div>

        {/* Platform Selector */}
        <div className="ai-field">
          <label className="ai-field-label">Plataforma</label>
          <div className="ai-toggle-group">
            {PLATFORMS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`ai-toggle-btn ${platform === value ? 'ai-toggle-btn--active' : ''}`}
                onClick={() => setPlatform(value)}
                disabled={isPending}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="ai-field">
          <label className="ai-field-label">Tono</label>
          <div className="ai-toggle-group">
            {TONES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`ai-toggle-btn ${tone === value ? 'ai-toggle-btn--active' : ''}`}
                onClick={() => setTone(value)}
                disabled={isPending}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          className="ai-gen-btn"
          onClick={handleGenerate}
          disabled={isPending || topic.trim().length < 3}
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="ai-spin" />
              <span>Generando…</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generar contenido</span>
            </>
          )}
        </button>

        {error && <p className="ai-error">{error}</p>}
      </div>

      {/* ── Right: Result ─────────────────────────────────── */}
      <div className="ai-gen-result-card">
        {!result && !isPending && (
          <div className="ai-empty">
            <Sparkles size={48} className="ai-empty-icon" />
            <p className="ai-empty-title">Tu contenido aparecerá aquí</p>
            <p className="ai-empty-subtitle">
              Escribe un tema, elige plataforma y tono, luego presiona
              &quot;Generar contenido&quot;
            </p>
          </div>
        )}

        {isPending && (
          <div className="ai-empty">
            <Loader2 size={48} className="ai-spin ai-empty-icon" />
            <p className="ai-empty-title">Generando contenido con IA…</p>
            <p className="ai-empty-subtitle">Esto puede tomar unos segundos</p>
          </div>
        )}

        {result && !isPending && (
          <div className="ai-result-body">
            {/* Title */}
            <ResultSection
              icon={<Type size={16} />}
              label="Título"
              onCopy={() => copyText(result.title, 'title')}
              isCopied={copied === 'title'}
            >
              <h3 className="ai-result-title">{result.title}</h3>
            </ResultSection>

            {/* Post */}
            <ResultSection
              icon={<FileText size={16} />}
              label="Post"
              onCopy={() => copyText(result.post, 'post')}
              isCopied={copied === 'post'}
            >
              <p className="ai-result-post">{result.post}</p>
            </ResultSection>

            {/* Hashtags */}
            <ResultSection
              icon={<Hash size={16} />}
              label="Hashtags"
              onCopy={() =>
                copyText(result.hashtags.map((h) => `#${h}`).join(' '), 'tags')
              }
              isCopied={copied === 'tags'}
            >
              <div className="ai-tags">
                {result.hashtags.map((h) => (
                  <span key={h} className="ai-tag">
                    #{h}
                  </span>
                ))}
              </div>
            </ResultSection>


            {/* Visual Idea */}
            <ResultSection
              icon={<Palette size={16} />}
              label="Idea visual"
              onCopy={() => copyText(result.visualIdea, 'visual')}
              isCopied={copied === 'visual'}
            >
              <p className="ai-result-visual">{result.visualIdea}</p>
            </ResultSection>

            {/* Best Time */}
            <ResultSection
              icon={<Clock size={16} />}
              label="Mejor hora para publicar"
              onCopy={() => copyText(result.bestTime, 'time')}
              isCopied={copied === 'time'}
            >
              <span className="ai-result-badge">{result.bestTime}</span>
            </ResultSection>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-component ─────────────────────────────────────────────────────── */

function ResultSection({
  icon,
  label,
  children,
  onCopy,
  isCopied,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  onCopy?: () => void
  isCopied?: boolean
}) {
  return (
    <div className="ai-section">
      <div className="ai-section-header">
        <span className="ai-section-label">
          {icon} {label}
        </span>
        {onCopy && (
          <button
            className="ai-copy-btn"
            onClick={onCopy}
            title="Copiar"
            type="button"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
