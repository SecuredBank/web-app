import DOMPurify from 'dompurify'

export interface XSSProtectionConfig {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowedSchemes?: string[]
}

const defaultConfig: XSSProtectionConfig = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

export class XSSProtection {
  private config: XSSProtectionConfig

  constructor(config: XSSProtectionConfig = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: Object.entries(this.config.allowedAttributes || {}).flatMap(
        ([_tag, attrs]) => attrs
      ),
      ALLOWED_URI_REGEXP: this.config.allowedSchemes
        ? new RegExp(`^(${this.config.allowedSchemes.join('|')})`, 'i')
        : undefined,
    })
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return this.config.allowedSchemes
        ? this.config.allowedSchemes.includes(parsedUrl.protocol.slice(0, -1))
        : true
    } catch {
      return false
    }
  }

  // For React applications, use this to sanitize props
  sanitizeProps<T extends Record<string, any>>(props: T): T {
    const sanitized = { ...props }
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('html')) {
          // For props that might contain HTML
          sanitized[key] = this.sanitizeInput(value)
        } else {
          // For regular string props
          sanitized[key] = this.escapeHtml(value)
        }
      }
    }
    return sanitized
  }
}

