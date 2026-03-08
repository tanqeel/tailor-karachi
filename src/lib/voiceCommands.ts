// Voice command parser for Urdu/English mixed speech
// Handles commands like "Ahmed ka suit dikhao", "pending orders dikhao", "Akram ka hisab batao"

export interface VoiceCommand {
  type: 'navigate' | 'search' | 'unknown';
  route?: string;
  searchTerm?: string;
  action?: string;
}

// Normalize text: lowercase, trim, remove extra spaces
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Navigation keyword mappings (Urdu transliteration + English)
const NAV_PATTERNS: { keywords: string[]; route: string }[] = [
  { keywords: ['dashboard', 'ڈیش بورڈ', 'home', 'ghar'], route: '/' },
  { keywords: ['customer', 'customers', 'گاہک', 'gahak', 'gaahak'], route: '/customers' },
  { keywords: ['order', 'orders', 'آرڈر', 'آرڈرز', 'aardar', 'arder'], route: '/orders' },
  { keywords: ['worker', 'workers', 'کاریگر', 'karigar', 'kaarigar'], route: '/workers' },
  { keywords: ['measurement', 'measurements', 'ناپ', 'naap'], route: '/measurements' },
  { keywords: ['payment', 'payments', 'ادائیگی', 'ادائیگیاں', 'adaigi', 'paisa', 'paise'], route: '/payments' },
  { keywords: ['ready', 'ready suits', 'تیار', 'tayyar', 'tayaar'], route: '/ready' },
  { keywords: ['report', 'reports', 'رپورٹ', 'رپورٹس', 'report'], route: '/reports' },
  { keywords: ['setting', 'settings', 'ترتیبات', 'setting'], route: '/settings' },
];

// Action keywords that indicate searching for a person/entity
const SEARCH_TRIGGERS = [
  'ka suit', 'ke suit', 'ki suit',
  'ka order', 'ke order', 'ki order',
  'ka hisab', 'ke hisab', 'ki hisab', 'ka hisaab', 'ke hisaab',
  'ka naap', 'ke naap',
  'ka payment', 'ke payment',
  'dikhao', 'batao', 'dekhao', 'show', 'find', 'search',
  'دکھاؤ', 'بتاؤ', 'تلاش',
];

// Status filter keywords
const STATUS_KEYWORDS: { keywords: string[]; filter: string }[] = [
  { keywords: ['pending', 'بقایا', 'baqaya', 'pending orders'], filter: 'pending' },
  { keywords: ['overdue', 'اوور ڈیو', 'late', 'دیر'], filter: 'overdue' },
  { keywords: ['ready', 'تیار', 'tayyar', 'tayaar'], filter: 'ready' },
  { keywords: ['delivered', 'حوالے', 'deliver'], filter: 'delivered' },
  { keywords: ['urgent', 'فوری', 'jaldi'], filter: 'urgent' },
];

export function parseVoiceCommand(rawText: string): VoiceCommand {
  const text = normalize(rawText);

  // Check for status-based navigation: "pending orders dikhao"
  for (const status of STATUS_KEYWORDS) {
    for (const kw of status.keywords) {
      if (text.includes(kw)) {
        // If it mentions orders
        if (text.includes('order') || text.includes('آرڈر') || text.includes('aardar') || text.includes('suit')) {
          return { type: 'navigate', route: '/orders', searchTerm: status.filter, action: 'filter' };
        }
        if (text.includes('payment') || text.includes('ادائیگی') || text.includes('paisa')) {
          return { type: 'navigate', route: '/payments', searchTerm: status.filter, action: 'filter' };
        }
        // Default to orders for status keywords
        return { type: 'navigate', route: '/orders', searchTerm: status.filter, action: 'filter' };
      }
    }
  }

  // Check for person-based search: "Ahmed ka suit dikhao"
  for (const trigger of SEARCH_TRIGGERS) {
    const idx = text.indexOf(trigger);
    if (idx > 0) {
      const name = text.slice(0, idx).trim();
      if (name.length > 0) {
        // Determine which page based on context
        if (trigger.includes('hisab') || trigger.includes('hisaab')) {
          return { type: 'search', route: '/workers', searchTerm: name, action: 'hisaab' };
        }
        if (trigger.includes('naap')) {
          return { type: 'search', route: '/measurements', searchTerm: name };
        }
        if (trigger.includes('payment')) {
          return { type: 'search', route: '/payments', searchTerm: name };
        }
        if (trigger.includes('order') || trigger.includes('suit')) {
          return { type: 'search', route: '/orders', searchTerm: name };
        }
        // Default: search customers
        return { type: 'search', route: '/customers', searchTerm: name };
      }
    }
  }

  // Check for pure navigation: "orders dikhao", "go to customers"
  for (const nav of NAV_PATTERNS) {
    for (const kw of nav.keywords) {
      if (text.includes(kw)) {
        return { type: 'navigate', route: nav.route };
      }
    }
  }

  // If ends with a search trigger, extract name
  const lastTrigger = SEARCH_TRIGGERS.find(t => text.endsWith(t));
  if (lastTrigger) {
    const name = text.slice(0, text.length - lastTrigger.length).trim();
    if (name) return { type: 'search', route: '/customers', searchTerm: name };
  }

  // Fallback: treat as search text
  if (text.length > 1) {
    return { type: 'search', searchTerm: rawText.trim() };
  }

  return { type: 'unknown' };
}
