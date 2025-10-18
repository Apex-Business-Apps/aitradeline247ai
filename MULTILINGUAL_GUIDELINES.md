# Multilingual & Cultural Guidelines

**IMPORTANT:** Do not modify any UI/UX elements unless explicitly instructed. These guidelines are for backend processing, RAG ingestion, and LLM context only.

---

## Language-Specific Guidelines

### Chinese (Mandarin) - `zh`
- **Script:** Use Simplified Chinese characters (简体中文) by default
- **Tone:** Maintain polite, respectful tone using appropriate honorifics
- **Forms of address:** Use 您 (nín) for formal contexts, 你 (nǐ) for casual
- **Cultural notes:** 
  - Avoid numbers 4 (四, sì) in contexts where superstition matters
  - Be mindful of hierarchical relationships
  - Prefer indirect communication for sensitive topics
- **Preprocessing:** Convert Traditional to Simplified when normalizing

### Spanish (Latin American) - `es-US`
- **Dialect:** Use Latin American Spanish, not European Spanish
- **Tone:** Warm, personal, use "usted" for formal contexts
- **Forms of address:** "usted" (formal), "tú" (casual/familiar)
- **Cultural notes:**
  - Family-oriented language resonates well
  - Avoid European Spanish slang (e.g., "vale", "tío")
  - Use "computadora" not "ordenador", "celular" not "móvil"
- **Preprocessing:** Maintain all accent marks (á, é, í, ó, ú, ñ)

### French (Canadian) - `fr-CA`
- **Dialect:** Quebec French, not European French
- **Tone:** Professional yet personable, use "vous" as default
- **Forms of address:** "vous" (default formal), "tu" (familiar only when appropriate)
- **Cultural notes:**
  - Respect linguistic pride - use Quebec terminology
  - "Courriel" not "e-mail", "magasiner" not "faire du shopping"
  - Be aware of language laws (Bill 101) implications for business
- **Preprocessing:** Maintain all accent marks (é, è, ê, ë, à, ù, ç, etc.)

### English (Canadian) - `en-CA`
- **Spelling:** Canadian English (colour, honour, centre, etc.)
- **Tone:** Polite, professional, slightly more formal than US English
- **Cultural notes:**
  - Bilingual sensitivity (many Canadians speak both English and French)
  - Use metric system references
  - Avoid aggressive sales language
- **Preprocessing:** Standard normalization, maintain British-influenced spelling

### English (US) - `en-US`
- **Spelling:** American English (color, honor, center, etc.)
- **Tone:** Direct, friendly, action-oriented
- **Cultural notes:**
  - Confidence and directness appreciated
  - Use imperial measurements where common
  - Fast-paced communication preferred
- **Preprocessing:** Standard normalization

### Hindi (Devanagari) - `hi`
- **Script:** Devanagari (देवनागरी)
- **Tone:** Respectful, use appropriate honorifics (जी suffix for respect)
- **Forms of address:** आप (āp, formal), तुम (tum, casual), तू (tū, intimate)
- **Cultural notes:**
  - Hierarchical respect is crucial
  - Use of titles (Sir, Madam) even in Hindi context
  - Religious sensitivity (avoid assumptions about practices)
  - Mix of Hindi-English (Hinglish) common in urban contexts
- **Preprocessing:** Maintain all Devanagari diacritics, normalize combining characters

### Arabic - `ar`
- **Script:** Right-to-left (RTL) Arabic script
- **Tone:** Formal, respectful, use Islamic greetings appropriately
- **Forms of address:** أنت (anta/anti, you), حضرتك (hadritak, formal you)
- **Cultural notes:**
  - Strong religious and cultural sensitivities
  - Use of "إن شاء الله" (inshallah, God willing) for future references
  - Avoid left-hand references in instructional content
  - Gender-specific language considerations
- **Preprocessing:** Remove optional diacritics (ّ ً ٌ ٍ َ ُ ِ etc.) for search normalization

### Portuguese (Brazilian) - `pt-BR`
- **Dialect:** Brazilian Portuguese, not European
- **Tone:** Warm, friendly, personable (Brazilians value rapport)
- **Forms of address:** "você" (informal you), "senhor/senhora" (formal)
- **Cultural notes:**
  - Very relationship-oriented culture
  - Humor and warmth appreciated
  - Avoid European Portuguese terms ("telemóvel" vs "celular")
- **Preprocessing:** Maintain all diacritics (ã, õ, á, é, í, ó, ú, ê, ô, â, ç)

### Japanese - `ja`
- **Script:** Mix of Hiragana, Katakana, and Kanji
- **Tone:** Extremely polite, use keigo (敬語, honorific language) appropriately
- **Forms of address:** です/ます form (polite), だ/である form (plain/casual)
- **Cultural notes:**
  - Indirect communication preferred
  - Avoid direct "no" - use softening phrases
  - Context and reading between lines is crucial
  - Seasonal references appreciated
- **Preprocessing:** Normalize to NFC, preserve all scripts

---

## Indigenous Languages (Placeholder - Pending Implementation)

### Cree - `cr`
- **Status:** Not yet supported
- **Notes:** Voice synthesis not available, text-only RAG feasible
- **Cultural considerations:** Elder consultation required for terminology
- **Implementation priority:** Medium (pending community partnerships)

### Inuktitut - `iu`
- **Status:** Not yet supported
- **Script:** Both Latin and Syllabics (ᐃᓄᒃᑎᑐᑦ)
- **Notes:** Voice synthesis not available, text-only RAG feasible
- **Cultural considerations:** Regional dialect variations significant
- **Implementation priority:** Medium (pending community partnerships)

### Ojibwe - `oj`
- **Status:** Not yet supported
- **Notes:** Voice synthesis not available, text-only RAG feasible
- **Cultural considerations:** Multiple orthographies in use
- **Implementation priority:** Low (requires standardization work)

---

## General Multilingual Guidelines

### Embedding & Search
- All text normalized to Unicode NFC before embedding
- Language-specific preprocessing applied before embedding (see per-language notes)
- Mixed-language queries supported (auto-detect query language)
- Results can match across languages if semantically similar

### Tone & Voice Principles (All Languages)
- **Empathy first:** Acknowledge user's situation before providing solution
- **Clarity over cleverness:** Prefer simple, direct language
- **Cultural humility:** Avoid assumptions about user's background
- **Accessibility:** Use plain language, avoid jargon unless contextually appropriate
- **Inclusivity:** Gender-neutral language where possible

### Prohibited Practices (All Languages)
- ❌ Machine translation without human review for customer-facing content
- ❌ Ignoring cultural context or making cultural assumptions
- ❌ Using slang or idioms that don't translate well
- ❌ Overly casual tone in formal languages (e.g., Chinese, Japanese, Arabic)
- ❌ Religious or political references unless contextually necessary
- ❌ Removing diacritics from user input (for display/output)

### Quality Standards
- Native speaker review required for all customer-facing translations
- Cultural consultant review for indigenous language content
- A/B testing for tone and messaging effectiveness per language
- Regular audits of multilingual RAG results for accuracy

---

## Implementation Status

| Language | UI Support | RAG Support | Voice Support | Status |
|----------|-----------|-------------|---------------|---------|
| en-US | ✅ | ✅ | ✅ | Production |
| en-CA | ✅ | ✅ | ✅ | Production |
| fr-CA | ✅ | ✅ | ✅ | Production |
| es-US | ❌ | ✅ | ✅ | Backend Only |
| zh | ❌ | ⚠️ | ✅ | Partial |
| hi | ❌ | ⚠️ | ❌ | Planned |
| ar | ❌ | ⚠️ | ❌ | Planned |
| pt-BR | ❌ | ⚠️ | ❌ | Planned |
| ja | ❌ | ⚠️ | ❌ | Planned |
| cr (Cree) | ❌ | ❌ | ❌ | Research |
| iu (Inuktitut) | ❌ | ❌ | ❌ | Research |
| oj (Ojibwe) | ❌ | ❌ | ❌ | Research |

**Legend:**
- ✅ Fully implemented and tested
- ⚠️ Embedding model supports, preprocessing pending
- ❌ Not implemented

---

## Revision History
- 2025-10-12: Initial guidelines document created (I18N•01)
