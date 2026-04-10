'use server'

import Groq from 'groq-sdk'

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type Platform = 'instagram' | 'linkedin' | 'tiktok'
export type Tone = 'casual' | 'professional' | 'motivational'

export interface GeneratedContent {
  title: string
  post: string
  hashtags: string[]
  visualIdea: string
  bestTime: string
}

export interface GenerateResult {
  success: boolean
  data?: GeneratedContent
  error?: string
  generatedAt?: string
}

/* ─── Config ────────────────────────────────────────────────────────────── */

const MAX_TITLE_WORDS = 10
const MIN_HASHTAGS = 8
const MAX_HASHTAGS = 15
const MAX_POST_LENGTH = 500

/* ─── Prompt helpers ────────────────────────────────────────────────────── */

function getPlatformGuidelines(platform: Platform): string {
  const map: Record<Platform, string> = {
    instagram: `
- Visual-first platform
- Ideal for carousel posts and image content
- Use emojis strategically
- Focus on aesthetics and storytelling
- Call-to-action should be clear
- Hashtags are crucial for discovery`,
    linkedin: `
- Professional and business-focused
- Longer-form content acceptable
- Data-driven insights perform well
- Industry terminology appropriate
- Focus on value and expertise
- Professional tone with some personality`,
    tiktok: `
- Trend-focused and entertaining
- High energy and engaging captions
- Clear call-to-action
- Educational content should be snackable
- Use trending language and references`,
  }
  return map[platform] || map.instagram
}

function getToneGuidelines(tone: Tone): string {
  const map: Record<Tone, string> = {
    casual: `
- Conversational and friendly
- Use contractions and simple language
- Relatable and approachable
- Light humor when appropriate
- Feel like talking to a friend`,
    professional: `
- Expert and authoritative
- Clear and structured
- Industry-appropriate terminology
- Data-backed claims
- Inspires confidence and trust`,
    motivational: `
- Inspiring and uplifting
- Action-oriented language
- Emotional connection
- Future-focused
- Encourages growth and learning`,
  }
  return map[tone] || map.casual
}

function buildPrompt(topic: string, platform: Platform, tone: Tone): string {
  return `Eres un creador de contenido BASTANTE CREATIVO y experto en viralidad para redes sociales de Riwi (educación tecnológica).

Tu objetivo es crear contenido SUPER ATRACTIVO, que llame mucho la atención y genere conversación sobre el tema: "${topic}"

PLATAFORMA: ${platform.toUpperCase()}
${getPlatformGuidelines(platform)}

TONO: ${tone.toUpperCase()}
${getToneGuidelines(tone)}

REQUISITOS CREATIVOS Y DE ESTILO (¡MUY IMPORTANTE!):
- TODO en ESPAÑOL natural, fluido y moderno.
- IMPROVISA y sé MUY ORIGINAL. No suenes como un bot. Usa analogías divertidas, datos curiosos o preguntas polémicas como gancho si aplica.
- 🚀 USA EMOJIS ABUNDANTEMENTE! Tanto en el título como a lo largo de todo el post. Úsalos para estructurar, resaltar y dar vida al texto.
- Escribe como un influencer digital humano: separa en párrafos cortos, usa negritas virtuales o mayúsculas para empatizar.
- El post DEBE tener un "Hook" (gancho inicial rompedor), "Valor/Cuerpo" (desarrollo rápido e interesante), y un "CTA" (llamado a la acción irresistible).
- NO ofrezcas contenido de video. Solo formato Texto/Imagen.
- Piensa en la mejor hora de impacto real (ej: "8:30 PM", "12:15 PM").

FORMATO DE RESPUESTA (solo JSON):
{
  "title": "Título ultra llamativo y original con emojis 💥 (máx ${MAX_TITLE_WORDS} palabras)",
  "post": "Contenido completo del post súper inmersivo, estructurado, lleno de personalidad y emojis 🔥 (máx ${MAX_POST_LENGTH} caracteres)",
  "hashtags": ["hashtag1", "hashtag2", "..."] (${MIN_HASHTAGS}-${MAX_HASHTAGS} hashtags relevantes sin el símbolo #),
  "visualIdea": "Concepto visual muy creativo y estético que acompañe el post",
  "bestTime": "Mejor hora exacta para publicar (ej. 7:45 PM)"
}

IMPORTANTE:
- Solo devuelve código JSON válido, sin texto extra.
- ¡Prioriza ser extremadamente creativo antes que formal! Rompe el molde.
- Exageradamente prohibido sonar aburrido o como una enciclopedia.

Genera tu creación ahora:`
}

/* ─── Response parser ───────────────────────────────────────────────────── */

function parseAndValidate(raw: string): GeneratedContent {
  const parsed = JSON.parse(raw)

  const required = ['title', 'post', 'hashtags', 'visualIdea'] as const
  const missing = required.filter((f) => !parsed[f])
  if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`)

  // Be flexible with hashtag count — clamp instead of erroring
  let hashtags: string[] = []
  if (Array.isArray(parsed.hashtags)) {
    hashtags = parsed.hashtags
      .slice(0, MAX_HASHTAGS)
      .map((t: string) => String(t).trim().replace(/^#/, ''))
      .filter((t: string) => t.length > 0)
  }
  // Pad if too few
  while (hashtags.length < MIN_HASHTAGS) {
    hashtags.push('tech')
  }

  return {
    title: String(parsed.title).trim(),
    post: String(parsed.post).trim().slice(0, MAX_POST_LENGTH),
    hashtags,
    visualIdea: String(parsed.visualIdea).trim(),
    bestTime: parsed.bestTime ? String(parsed.bestTime).trim() : '7:00 PM',
  }
}

/* ─── Fallback ──────────────────────────────────────────────────────────── */

function fallback(topic: string): GeneratedContent {
  return {
    title: `${topic} — Perspectivas Tech`,
    post: `Descubre las últimas perspectivas sobre ${topic}. ¡Mantente al tanto de más contenido de educación tecnológica de Riwi!`,
    hashtags: ['tech', 'educacion', 'aprendizaje', 'riwi', 'innovacion', 'programacion', 'dev', 'crecimiento'],
    visualIdea: 'Tipografía limpia con gráficos inspirados en tecnología',
    bestTime: '7:00 PM',
  }
}

/* ─── Server action ─────────────────────────────────────────────────────── */

export async function generateContent(
  topic: string,
  platform: Platform,
  tone: Tone,
): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return { success: false, error: 'GROQ_API_KEY no configurada en el servidor.' }
  }

  try {
    const groq = new Groq({ apiKey })

    const prompt = buildPrompt(topic, platform, tone)

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional social media content creator for a tech education brand. Always respond with valid JSON only. Never suggest video content.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: Number(process.env.GROQ_MAX_TOKENS) || 1000,
      temperature: Number(process.env.GROQ_TEMPERATURE) || 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from Groq')

    const data = parseAndValidate(raw)
    return { success: true, data, generatedAt: new Date().toISOString() }
  } catch (err: unknown) {
    console.error('[AI Content Generator]', err)
    const data = fallback(topic)
    return {
      success: true,
      data,
      generatedAt: new Date().toISOString(),
    }
  }
}
