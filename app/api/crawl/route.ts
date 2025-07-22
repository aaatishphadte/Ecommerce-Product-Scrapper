import type { NextRequest } from "next/server"

interface CrawlRequest {
  domains: string[]
  maxDepth: number
  maxPages: number
  concurrency: number
}

interface CrawlUpdate {
  domain: string
  productUrls: string[]
  status: "pending" | "crawling" | "completed" | "error"
  progress: number
  error?: string
}

// Product URL patterns for different e-commerce sites
const PRODUCT_PATTERNS = [
  /\/product\//i,
  /\/item\//i,
  /\/p\//i,
  /\/products\//i,
  /\/dp\//i,
  /\/goods\//i,
  /\/detail\//i,
  /\/buy\//i,
  /\/shop\/.*\/\d+/i,
  /\/[^/]+\/[^/]+\/[^/]+\.(html|htm)$/i,
  /\/\d+\.html?$/i,
  /\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/i,
]

// Common navigation patterns to follow
const NAVIGATION_PATTERNS = [
  /\/category\//i,
  /\/categories\//i,
  /\/collection\//i,
  /\/collections\//i,
  /\/brand\//i,
  /\/brands\//i,
  /\/shop\//i,
  /\/store\//i,
  /\/catalog\//i,
  /\/browse\//i,
  /\/men\//i,
  /\/women\//i,
  /\/kids\//i,
  /\/sale\//i,
  /\/new\//i,
  /\/trending\//i,
]

class EcommerceCrawler {
  private visitedUrls = new Set<string>()
  private productUrls = new Set<string>()
  private domain: string
  private maxDepth: number
  private maxPages: number
  private concurrency: number
  private onUpdate: (update: Partial<CrawlUpdate>) => void

  constructor(
    domain: string,
    maxDepth: number,
    maxPages: number,
    concurrency: number,
    onUpdate: (update: Partial<CrawlUpdate>) => void,
  ) {
    this.domain = domain
    this.maxDepth = maxDepth
    this.maxPages = maxPages
    this.concurrency = concurrency
    this.onUpdate = onUpdate
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === new URL(this.domain).hostname
    } catch {
      return false
    }
  }

  private isProductUrl(url: string): boolean {
    return PRODUCT_PATTERNS.some((pattern) => pattern.test(url))
  }

  private isNavigationUrl(url: string): boolean {
    return NAVIGATION_PATTERNS.some((pattern) => pattern.test(url))
  }

  private extractUrls(html: string, baseUrl: string): string[] {
    const urls: string[] = []
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href
        if (this.isValidUrl(url)) {
          urls.push(url)
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return [...new Set(urls)]
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) return null
      return await response.text()
    } catch {
      return null
    }
  }

  private async crawlUrl(url: string, depth: number): Promise<string[]> {
    if (depth > this.maxDepth || this.visitedUrls.has(url) || this.visitedUrls.size >= this.maxPages) {
      return []
    }

    this.visitedUrls.add(url)

    // Update progress
    const progress = Math.min((this.visitedUrls.size / this.maxPages) * 100, 100)
    this.onUpdate({ progress })

    const html = await this.fetchPage(url)
    if (!html) return []

    // Check if this is a product page
    if (this.isProductUrl(url)) {
      this.productUrls.add(url)
      this.onUpdate({
        productUrls: Array.from(this.productUrls),
        progress,
      })
    }

    // Extract and filter URLs for further crawling
    const extractedUrls = this.extractUrls(html, url)
    const urlsToVisit = extractedUrls.filter(
      (extractedUrl) =>
        !this.visitedUrls.has(extractedUrl) &&
        (this.isProductUrl(extractedUrl) || this.isNavigationUrl(extractedUrl) || depth === 0),
    )

    return urlsToVisit
  }

  async crawl(): Promise<string[]> {
    try {
      this.onUpdate({ status: "crawling", progress: 0 })

      const queue = [{ url: this.domain, depth: 0 }]
      const activePromises = new Set<Promise<void>>()

      while (queue.length > 0 || activePromises.size > 0) {
        // Start new crawls up to concurrency limit
        while (queue.length > 0 && activePromises.size < this.concurrency && this.visitedUrls.size < this.maxPages) {
          const { url, depth } = queue.shift()!

          const promise = this.crawlUrl(url, depth)
            .then((newUrls) => {
              // Add new URLs to queue for next depth level
              newUrls.forEach((newUrl) => {
                if (!this.visitedUrls.has(newUrl)) {
                  queue.push({ url: newUrl, depth: depth + 1 })
                }
              })
            })
            .finally(() => {
              activePromises.delete(promise)
            })

          activePromises.add(promise)
        }

        // Wait for at least one promise to complete
        if (activePromises.size > 0) {
          await Promise.race(activePromises)
        }
      }

      this.onUpdate({
        status: "completed",
        progress: 100,
        productUrls: Array.from(this.productUrls),
      })

      return Array.from(this.productUrls)
    } catch (error) {
      this.onUpdate({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return []
    }
  }
}

export async function POST(request: NextRequest) {
  const { domains, maxDepth, maxPages, concurrency }: CrawlRequest = await request.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const crawlers = domains.map((domain) => {
        const onUpdate = (update: Partial<CrawlUpdate>) => {
          const fullUpdate: CrawlUpdate = {
            domain,
            productUrls: [],
            status: "pending",
            progress: 0,
            ...update,
          }
          controller.enqueue(encoder.encode(JSON.stringify(fullUpdate) + "\n"))
        }

        return new EcommerceCrawler(domain, maxDepth, maxPages, concurrency, onUpdate)
      })

      // Start all crawlers in parallel
      await Promise.all(crawlers.map((crawler) => crawler.crawl()))

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
