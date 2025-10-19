/**
 * Multilingual Text Normalization for RAG Embeddings
 * 
 * Implements language-specific preprocessing before embedding generation.
 * All functions are idempotent (running twice produces same result).
 * 
 * Reference: MULTILINGUAL_GUIDELINES.md
 */

/**
 * Detect language from text (simple heuristic-based detection)
 * Falls back to 'en' if uncertain
 */
export function detectLanguage(text: string): string {
  const sample = text.substring(0, 200).toLowerCase();
  
  // Character-based detection
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh'; // Chinese
  if (/[\u0600-\u06ff]/.test(sample)) return 'ar'; // Arabic
  if (/[\u0900-\u097f]/.test(sample)) return 'hi'; // Hindi/Devanagari
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return 'ja'; // Japanese
  
  // European languages - keyword-based
  if (/\b(señor|señora|gracias|por favor|hola)\b/.test(sample)) return 'es-US';
  if (/\b(courriel|bonjour|merci|s'il vous plaît)\b/.test(sample)) return 'fr-CA';
  if (/\b(obrigad[oa]|senhor|senhora|por favor)\b/.test(sample)) return 'pt-BR';
  
  // Default to English
  return 'en';
}

/**
 * Remove Arabic diacritics for better search matching
 * Preserves base letters only
 */
function removeArabicDiacritics(text: string): string {
  // Remove Arabic diacritical marks (tashkeel)
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Convert Traditional Chinese to Simplified (simplified mapping)
 * Note: This is a basic implementation; production should use proper library
 */
function traditionalToSimplified(text: string): string {
  // Basic mappings for common characters
  const mapping: Record<string, string> = {
    '繁': '繁', '體': '体', '電': '电', '話': '话', 
    '網': '网', '際': '际', '銀': '银', '行': '行',
    '國': '国', '際': '际', '語': '语', '學': '学',
    // Add more mappings as needed
  };
  
  return text.split('').map(char => mapping[char] || char).join('');
}

/**
 * Normalize text for specific language before embedding
 */
function normalizeForLanguage(text: string, language: string): string {
  switch (language) {
    case 'ar':
      // Remove optional Arabic diacritics for better matching
      return removeArabicDiacritics(text);
    
    case 'zh':
      // Convert Traditional to Simplified if detected
      // (In production, use a proper library like opencc)
      return traditionalToSimplified(text);
    
    case 'hi':
    case 'ja':
    case 'es-US':
    case 'fr-CA':
    case 'pt-BR':
    case 'en-CA':
    case 'en-US':
    case 'en':
      // Preserve all diacritics and special characters
      return text;
    
    default:
      return text;
  }
}

/**
 * Main normalization function for embedding input
 * 
 * Steps:
 * 1. Unicode NFC normalization (idempotent)
 * 2. Language detection
 * 3. Language-specific preprocessing
 * 4. Whitespace cleanup
 * 
 * @param text - Raw input text
 * @param explicitLang - Optional language override (skip detection)
 * @returns Normalized text and detected language
 */
export function normalizeTextForEmbedding(
  text: string, 
  explicitLang?: string
): { normalized: string; language: string } {
  // Step 1: Unicode NFC normalization (combines combining characters)
  // This is idempotent and safe to run multiple times
  let normalized = text.normalize('NFC');
  
  // Step 2: Detect or use explicit language
  const language = explicitLang || detectLanguage(normalized);
  
  // Step 3: Apply language-specific preprocessing
  normalized = normalizeForLanguage(normalized, language);
  
  // Step 4: Clean up excessive whitespace (but preserve single spaces)
  normalized = normalized
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .trim();                // Remove leading/trailing whitespace
  
  return { normalized, language };
}

/**
 * Batch normalization for multiple texts
 * Useful for bulk ingestion
 */
export function normalizeTextBatch(
  texts: Array<{ text: string; language?: string }>
): Array<{ normalized: string; language: string; originalText: string }> {
  return texts.map(({ text, language }) => {
    const result = normalizeTextForEmbedding(text, language);
    return {
      ...result,
      originalText: text
    };
  });
}

/**
 * Cache key generator for embeddings
 * Creates consistent hash for caching
 */
export function generateCacheKey(text: string, model: string): string {
  // Normalize first to ensure cache hits
  const { normalized } = normalizeTextForEmbedding(text);
  
  // Simple hash (for production, use crypto.subtle.digest)
  const textForHash = `${model}:${normalized}`;
  
  // Create a simple hash (this is just for demonstration)
  // In production, use proper hashing
  return btoa(textForHash).substring(0, 32);
}

