// Language detection and adaptive AI generation utilities
// This is a utility library - NOT a server action file

export interface LanguageDetectionResult {
  detectedLanguage: string
  languageName: string
  confidence: "high" | "medium" | "low"
  script: string
}

// Common language patterns for detection
const LANGUAGE_PATTERNS: Record<string, { regex: RegExp; name: string; script: string }> = {
  // CJK Languages
  ko: { regex: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/u, name: "Korean", script: "Hangul" },
  ja: { regex: /[\u3040-\u309F\u30A0-\u30FF]/u, name: "Japanese", script: "Japanese" },
  zh: { regex: /[\u4E00-\u9FFF\u3400-\u4DBF]/u, name: "Chinese", script: "Han" },
  
  // Middle Eastern Languages
  ar: { regex: /[\u0600-\u06FF\u0750-\u077F]/u, name: "Arabic", script: "Arabic" },
  fa: { regex: /[\u0600-\u06FF].*[\u06A9\u06AF\u067E\u0686]/u, name: "Persian", script: "Arabic" },
  he: { regex: /[\u0590-\u05FF]/u, name: "Hebrew", script: "Hebrew" },
  
  // South Asian Languages
  hi: { regex: /[\u0900-\u097F]/u, name: "Hindi", script: "Devanagari" },
  bn: { regex: /[\u0980-\u09FF]/u, name: "Bengali", script: "Bengali" },
  ta: { regex: /[\u0B80-\u0BFF]/u, name: "Tamil", script: "Tamil" },
  th: { regex: /[\u0E00-\u0E7F]/u, name: "Thai", script: "Thai" },
  
  // Cyrillic Languages
  ru: { regex: /[\u0400-\u04FF]/u, name: "Russian", script: "Cyrillic" },
  uk: { regex: /[\u0400-\u04FF].*[іїєґ]/ui, name: "Ukrainian", script: "Cyrillic" },
  
  // Greek
  el: { regex: /[\u0370-\u03FF]/u, name: "Greek", script: "Greek" },
}

// Latin-based language detection using common words
const LATIN_LANGUAGE_MARKERS: Record<string, string[]> = {
  es: ["el", "la", "los", "las", "de", "en", "que", "por", "con", "para", "del", "una", "como", "está", "más", "pero", "su", "sus", "este", "esta", "cuando", "sobre", "también", "puede", "ser", "entre", "después", "desde", "todo", "todos"],
  fr: ["le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "que", "qui", "pour", "dans", "ce", "cette", "avec", "sur", "pas", "sont", "par", "plus", "être", "au", "aux", "ou", "mais", "ont", "comme", "tout"],
  de: ["der", "die", "das", "und", "ist", "ein", "eine", "für", "mit", "auf", "den", "dem", "nicht", "sich", "von", "auch", "es", "werden", "aus", "nach", "bei", "oder", "nur", "wenn", "kann", "noch", "werden", "über", "diese", "wie"],
  pt: ["o", "a", "os", "as", "de", "da", "do", "em", "um", "uma", "que", "para", "com", "por", "no", "na", "se", "como", "mais", "ou", "ao", "seu", "sua", "também", "são", "está", "foi", "ser", "tem", "isso"],
  it: ["il", "la", "lo", "le", "di", "da", "in", "un", "una", "che", "per", "con", "del", "della", "sono", "è", "come", "questo", "questa", "anche", "non", "più", "suo", "sua", "essere", "stato", "nel", "nella", "hanno", "tra"],
  nl: ["de", "het", "een", "van", "en", "in", "is", "op", "te", "dat", "voor", "met", "zijn", "niet", "aan", "ook", "om", "als", "er", "maar", "bij", "door", "naar", "worden", "dit", "deze", "kan", "nog", "wel", "meer"],
  tr: ["bir", "ve", "bu", "için", "ile", "da", "de", "ne", "var", "olan", "gibi", "daha", "kadar", "sonra", "olarak", "ancak", "ama", "çok", "her", "hem", "ya", "veya", "olan", "oldu", "değil", "bunu", "olan", "eden", "etmek", "yapmak"],
}

/**
 * Detect the language of a given text
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { detectedLanguage: "en", languageName: "English", confidence: "low", script: "Latin" }
  }

  const cleanText = text.trim()
  
  // First, check for non-Latin scripts (highest confidence)
  for (const [code, { regex, name, script }] of Object.entries(LANGUAGE_PATTERNS)) {
    if (regex.test(cleanText)) {
      // Count matches to determine confidence
      const matches = cleanText.match(new RegExp(regex.source, "gu")) || []
      const ratio = matches.length / cleanText.length
      
      return {
        detectedLanguage: code,
        languageName: name,
        confidence: ratio > 0.3 ? "high" : ratio > 0.1 ? "medium" : "low",
        script,
      }
    }
  }

  // For Latin-based scripts, analyze word patterns
  const words = cleanText.toLowerCase().split(/\s+/)
  const wordCount = words.length
  
  if (wordCount < 3) {
    return { detectedLanguage: "en", languageName: "English", confidence: "low", script: "Latin" }
  }

  let bestMatch = { code: "en", count: 0, name: "English" }
  
  for (const [code, markers] of Object.entries(LATIN_LANGUAGE_MARKERS)) {
    const matchCount = words.filter(word => markers.includes(word)).length
    if (matchCount > bestMatch.count) {
      bestMatch = {
        code,
        count: matchCount,
        name: code === "es" ? "Spanish" :
              code === "fr" ? "French" :
              code === "de" ? "German" :
              code === "pt" ? "Portuguese" :
              code === "it" ? "Italian" :
              code === "nl" ? "Dutch" :
              code === "tr" ? "Turkish" : "English",
      }
    }
  }

  const ratio = bestMatch.count / wordCount
  const confidence = ratio > 0.15 ? "high" : ratio > 0.08 ? "medium" : "low"

  // If no strong match, default to English
  if (confidence === "low" && bestMatch.count < 2) {
    return { detectedLanguage: "en", languageName: "English", confidence: "low", script: "Latin" }
  }

  return {
    detectedLanguage: bestMatch.code,
    languageName: bestMatch.name,
    confidence,
    script: "Latin",
  }
}

/**
 * Determine the predominant language from title and description
 */
export function detectPredominantLanguage(
  title: string | undefined,
  description: string | undefined,
  explicitLanguage?: string
): LanguageDetectionResult {
  // If explicit language is provided, use it
  if (explicitLanguage) {
    const languageMap: Record<string, { name: string; script: string }> = {
      en: { name: "English", script: "Latin" },
      ko: { name: "Korean", script: "Hangul" },
      ja: { name: "Japanese", script: "Japanese" },
      zh: { name: "Chinese", script: "Han" },
      ar: { name: "Arabic", script: "Arabic" },
      es: { name: "Spanish", script: "Latin" },
      fr: { name: "French", script: "Latin" },
      de: { name: "German", script: "Latin" },
      pt: { name: "Portuguese", script: "Latin" },
      it: { name: "Italian", script: "Latin" },
      ru: { name: "Russian", script: "Cyrillic" },
      hi: { name: "Hindi", script: "Devanagari" },
      tr: { name: "Turkish", script: "Latin" },
    }
    
    const lang = languageMap[explicitLanguage.toLowerCase()] || { name: "English", script: "Latin" }
    return {
      detectedLanguage: explicitLanguage.toLowerCase(),
      languageName: lang.name,
      confidence: "high",
      script: lang.script,
    }
  }

  // Detect from title
  const titleResult = title ? detectLanguage(title) : null
  
  // Detect from description
  const descResult = description ? detectLanguage(description) : null

  // If both are provided, use the one with higher confidence or the description (more text)
  if (titleResult && descResult) {
    // If they match, high confidence
    if (titleResult.detectedLanguage === descResult.detectedLanguage) {
      return {
        ...descResult,
        confidence: "high",
      }
    }
    
    // If description has higher confidence or more text, prefer it
    if (descResult.confidence === "high" || (description && description.length > 50)) {
      return descResult
    }
    
    // Otherwise use title result
    return titleResult
  }

  // Return whichever is available
  return descResult || titleResult || {
    detectedLanguage: "en",
    languageName: "English",
    confidence: "low",
    script: "Latin",
  }
}

/**
 * Generate language instruction for AI prompts
 */
export function getLanguageInstruction(langResult: LanguageDetectionResult): string {
  if (langResult.detectedLanguage === "en") {
    return "Generate all content in English."
  }

  return `IMPORTANT: Generate ALL content in ${langResult.languageName}. 
The user has provided content in ${langResult.languageName}, so your entire response must be in ${langResult.languageName}.
This includes:
- Stage names
- Step names and descriptions  
- Touchpoint descriptions
- Pain point descriptions
- Highlight descriptions
- All narrative text
- Everything except JSON structure keys

DO NOT translate or mix languages. Keep everything consistently in ${langResult.languageName}.`
}

/**
 * Comprehensive language name to code mapping
 * Includes English names, native names, and common variations
 */
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  // English names
  english: "en",
  korean: "ko",
  japanese: "ja",
  chinese: "zh",
  "mandarin": "zh",
  "cantonese": "zh",
  arabic: "ar",
  spanish: "es",
  french: "fr",
  german: "de",
  portuguese: "pt",
  italian: "it",
  russian: "ru",
  hindi: "hi",
  turkish: "tr",
  dutch: "nl",
  thai: "th",
  vietnamese: "vi",
  indonesian: "id",
  malay: "ms",
  polish: "pl",
  ukrainian: "uk",
  persian: "fa",
  farsi: "fa",
  urdu: "ur",
  
  // Native/local names
  español: "es",
  espanol: "es",
  castellano: "es",
  français: "fr",
  francais: "fr",
  deutsch: "de",
  português: "pt",
  portugues: "pt",
  italiano: "it",
  русский: "ru",
  russkiy: "ru",
  한국어: "ko",
  hangugeo: "ko",
  日本語: "ja",
  nihongo: "ja",
  中文: "zh",
  zhongwen: "zh",
  العربية: "ar",
  عربي: "ar",
  हिन्दी: "hi",
  türkçe: "tr",
  turkce: "tr",
  "tiếng việt": "vi",
  "tieng viet": "vi",
  bahasa: "id", // Usually means Indonesian
  "bahasa indonesia": "id",
  "bahasa melayu": "ms",
  polski: "pl",
  українська: "uk",
  فارسی: "fa",
  اردو: "ur",
  ไทย: "th",
  nederlands: "nl",
}

/**
 * Extract explicit language instruction from text
 * Supports various patterns in multiple languages for requesting output language
 */
export function extractExplicitLanguage(text: string): string | undefined {
  if (!text) return undefined
  
  const lowerText = text.toLowerCase()
  
  // Patterns for explicit language requests (prioritized - most specific first)
  const patterns = [
    // Direct language specification
    /(?:output|response|generate|write|create|make|provide)\s+(?:this\s+)?(?:content\s+)?(?:all\s+)?in\s+(\w+(?:\s+\w+)?)/i,
    /(?:in|using|use)\s+(\w+(?:\s+\w+)?)\s+(?:language|please|por favor|s'il vous plaît|bitte)/i,
    /language[:\s]+(\w+(?:\s+\w+)?)/i,
    /(?:respond|answer|reply)\s+in\s+(\w+(?:\s+\w+)?)/i,
    // Spanish request patterns
    /(?:en|escribe(?:lo)?|genera(?:lo)?|crea(?:lo)?)\s+(?:en\s+)?(\w+)/i,
    // French request patterns
    /(?:en|écris|génère|crée)\s+(?:en\s+)?(\w+)/i,
    // German request patterns
    /(?:auf|schreib|generier|erstell)\s+(?:auf\s+)?(\w+)/i,
    // Portuguese request patterns
    /(?:em|escreve|gera|cria)\s+(?:em\s+)?(\w+)/i,
    // General "in X" pattern at end of text
    /\bin\s+(\w+)$/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const langName = match[1].toLowerCase().trim()
      
      // Check if it's a known language name
      const langCode = LANGUAGE_NAME_TO_CODE[langName]
      if (langCode) {
        return langCode
      }
      
      // Check if it's already a language code (2-3 chars)
      if (langName.length <= 3 && /^[a-z]+(-[a-z]+)?$/i.test(langName)) {
        return langName
      }
    }
  }

  return undefined
}

/**
 * Language detection result with reasoning for transparency
 */
export interface SmartLanguageResult {
  language: string
  languageName: string
  confidence: "high" | "medium" | "low"
  source: "explicit_request" | "content_detected" | "user_selection" | "default"
  reasoning: string
}

/**
 * Smart language detection with clear priority order:
 * 1. Explicit request in prompt ("generate in Spanish", "en español")
 * 2. Language detected from content (title/description text)
 * 3. User's manual selection in the language picker
 * 4. Default to English
 * 
 * Returns the detected language with reasoning for transparency
 */
export function smartDetectLanguage(params: {
  prompt?: string
  title?: string
  description?: string
  userSelection?: string
}): SmartLanguageResult {
  const { prompt, title, description, userSelection } = params
  
  // Priority 1: Check for explicit language request in the prompt
  if (prompt) {
    const explicitLang = extractExplicitLanguage(prompt)
    if (explicitLang) {
      const langInfo = getLanguageInfo(explicitLang)
      return {
        language: explicitLang,
        languageName: langInfo.name,
        confidence: "high",
        source: "explicit_request",
        reasoning: `User explicitly requested "${langInfo.name}" in their prompt`,
      }
    }
  }
  
  // Priority 2: Detect language from content (title and description)
  const contentText = [title, description].filter(Boolean).join(" ")
  if (contentText.length > 3) {
    const contentResult = detectLanguage(contentText)
    
    // Only use content detection if confidence is medium or high
    // This prevents false positives from common words
    if (contentResult.confidence !== "low" && contentResult.detectedLanguage !== "en") {
      return {
        language: contentResult.detectedLanguage,
        languageName: contentResult.languageName,
        confidence: contentResult.confidence,
        source: "content_detected",
        reasoning: `Detected ${contentResult.languageName} from the ${title ? "title" : "description"} text with ${contentResult.confidence} confidence`,
      }
    }
  }
  
  // Priority 3: Use user's manual selection if provided and not English
  // (English is treated as "no preference" since it's the default)
  if (userSelection && userSelection !== "en") {
    const langInfo = getLanguageInfo(userSelection)
    return {
      language: userSelection,
      languageName: langInfo.name,
      confidence: "high",
      source: "user_selection",
      reasoning: `User selected "${langInfo.name}" in the language picker`,
    }
  }
  
  // Priority 4: Default to English
  return {
    language: "en",
    languageName: "English",
    confidence: "medium",
    source: "default",
    reasoning: "No specific language detected or requested, defaulting to English",
  }
}

/**
 * Get language info from code
 */
function getLanguageInfo(code: string): { name: string; script: string } {
  const languageMap: Record<string, { name: string; script: string }> = {
    en: { name: "English", script: "Latin" },
    ko: { name: "Korean", script: "Hangul" },
    ja: { name: "Japanese", script: "Japanese" },
    zh: { name: "Chinese", script: "Han" },
    "zh-tw": { name: "Chinese (Traditional)", script: "Han" },
    ar: { name: "Arabic", script: "Arabic" },
    es: { name: "Spanish", script: "Latin" },
    fr: { name: "French", script: "Latin" },
    de: { name: "German", script: "Latin" },
    pt: { name: "Portuguese", script: "Latin" },
    it: { name: "Italian", script: "Latin" },
    ru: { name: "Russian", script: "Cyrillic" },
    hi: { name: "Hindi", script: "Devanagari" },
    tr: { name: "Turkish", script: "Latin" },
    nl: { name: "Dutch", script: "Latin" },
    th: { name: "Thai", script: "Thai" },
    vi: { name: "Vietnamese", script: "Latin" },
    id: { name: "Indonesian", script: "Latin" },
    ms: { name: "Malay", script: "Latin" },
    pl: { name: "Polish", script: "Latin" },
    uk: { name: "Ukrainian", script: "Cyrillic" },
    fa: { name: "Persian", script: "Arabic" },
    ur: { name: "Urdu", script: "Arabic" },
  }
  
  return languageMap[code.toLowerCase()] || { name: "English", script: "Latin" }
}
