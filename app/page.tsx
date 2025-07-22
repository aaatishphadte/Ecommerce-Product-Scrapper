"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Download, Play, Pause, RotateCcw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CrawlResult {
  domain: string
  productUrls: string[]
  status: "pending" | "crawling" | "completed" | "error"
  progress: number
  error?: string
}

export default function EcommerceCrawler() {
  const [domains, setDomains] = useState(
    [
      "https://www.virgio.com/",
      "https://www.tatacliq.com/",
      "https://nykaafashion.com/",
      "https://www.westside.com/",
    ].join("\n"),
  )

  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([])
  const [isRunning, setCrawling] = useState(false)
  const [maxDepth, setMaxDepth] = useState(3)
  const [maxPages, setMaxPages] = useState(1000)
  const [concurrency, setConcurrency] = useState(5)

  const startCrawling = async () => {
    const domainList = domains.split("\n").filter((d) => d.trim())
    setCrawling(true)

    // Initialize results
    const initialResults: CrawlResult[] = domainList.map((domain) => ({
      domain: domain.trim(),
      productUrls: [],
      status: "pending",
      progress: 0,
    }))
    setCrawlResults(initialResults)

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: domainList.map((d) => d.trim()),
          maxDepth,
          maxPages,
          concurrency,
        }),
      })

      if (!response.ok) throw new Error("Crawling failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const update = JSON.parse(line)
            setCrawlResults((prev) =>
              prev.map((result) => (result.domain === update.domain ? { ...result, ...update } : result)),
            )
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      console.error("Crawling error:", error)
      setCrawlResults((prev) =>
        prev.map((result) => ({
          ...result,
          status: "error" as const,
          error: "Failed to start crawling",
        })),
      )
    } finally {
      setCrawling(false)
    }
  }

  const stopCrawling = () => {
    setCrawling(false)
    // In a real implementation, you'd send a stop signal to the backend
  }

  const resetCrawling = () => {
    setCrawlResults([])
    setCrawling(false)
  }

  const downloadResults = () => {
    const results = crawlResults.reduce(
      (acc, result) => {
        acc[result.domain] = result.productUrls
        return acc
      },
      {} as Record<string, string[]>,
    )

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "product-urls.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalUrls = crawlResults.reduce((sum, result) => sum + result.productUrls.length, 0)
  const completedDomains = crawlResults.filter((r) => r.status === "completed").length
  const overallProgress =
    crawlResults.length > 0 ? crawlResults.reduce((sum, r) => sum + r.progress, 0) / crawlResults.length : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">E-commerce Product URL Crawler</h1>
        <p className="text-muted-foreground">
          Discover and extract product URLs from multiple e-commerce websites efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set up your crawling parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domains">Target Domains</Label>
                <Textarea
                  id="domains"
                  placeholder="Enter domains (one per line)"
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isRunning}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDepth">Max Depth</Label>
                  <Input
                    id="maxDepth"
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    min={1}
                    max={10}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPages">Max Pages</Label>
                  <Input
                    id="maxPages"
                    type="number"
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value))}
                    min={10}
                    max={10000}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="concurrency">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  min={1}
                  max={20}
                  disabled={isRunning}
                />
              </div>

              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={startCrawling} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start Crawling
                  </Button>
                ) : (
                  <Button onClick={stopCrawling} variant="destructive" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
                <Button onClick={resetCrawling} variant="outline" disabled={isRunning}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {crawlResults.length > 0 && (
                <Button onClick={downloadResults} variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {crawlResults.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total URLs Found:</span>
                    <Badge variant="secondary">{totalUrls}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Domains:</span>
                    <Badge variant="secondary">
                      {completedDomains}/{crawlResults.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress:</span>
                      <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Crawling Results</CardTitle>
              <CardDescription>Real-time progress and discovered product URLs</CardDescription>
            </CardHeader>
            <CardContent>
              {crawlResults.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Configure your domains and click "Start Crawling" to begin
                </div>
              ) : (
                <Tabs defaultValue={crawlResults[0]?.domain} className="h-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    {crawlResults.map((result, index) => (
                      <TabsTrigger key={result.domain} value={result.domain} className="text-xs">
                        Domain {index + 1}
                        {result.status === "completed" && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {result.productUrls.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {crawlResults.map((result) => (
                    <TabsContent key={result.domain} value={result.domain} className="h-[450px]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{result.domain}</h3>
                          <Badge
                            variant={
                              result.status === "completed"
                                ? "default"
                                : result.status === "error"
                                  ? "destructive"
                                  : result.status === "crawling"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>

                        {result.status === "crawling" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress:</span>
                              <span>{Math.round(result.progress)}%</span>
                            </div>
                            <Progress value={result.progress} />
                          </div>
                        )}

                        {result.error && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{result.error}</AlertDescription>
                          </Alert>
                        )}

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Product URLs ({result.productUrls.length})</span>
                          </div>
                          <ScrollArea className="h-[300px] border rounded-md p-2">
                            {result.productUrls.length === 0 ? (
                              <div className="text-muted-foreground text-sm">
                                {result.status === "pending"
                                  ? "Waiting to start..."
                                  : result.status === "crawling"
                                    ? "Discovering URLs..."
                                    : "No product URLs found"}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {result.productUrls.map((url, index) => (
                                  <div key={index} className="text-xs font-mono p-1 bg-muted rounded">
                                    {url}
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
