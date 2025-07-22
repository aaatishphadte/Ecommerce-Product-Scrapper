# E-commerce Product URL Crawler

A scalable, high-performance web crawler designed to discover and extract product URLs from multiple e-commerce websites. Built with Next.js and TypeScript, featuring real-time progress tracking and parallel processing capabilities.

## 🚀 Features

- **Multi-domain Support**: Crawl multiple e-commerce websites simultaneously
- **Intelligent URL Detection**: Advanced pattern matching for product URLs across different platforms
- **Real-time Progress**: Live updates and progress tracking for each domain
- **Scalable Architecture**: Handles hundreds of domains with configurable concurrency
- **Robust Error Handling**: Graceful handling of network errors and edge cases
- **Export Functionality**: Download results in structured JSON format
- **Responsive UI**: Modern, intuitive interface built with shadcn/ui

## 🏗️ Architecture

### Core Components

1. **Frontend (React/Next.js)**
   - Interactive dashboard for configuration and monitoring
   - Real-time progress updates via streaming API
   - Results visualization and export functionality

2. **Backend API**
   - Streaming endpoint for real-time crawl updates
   - Parallel processing with configurable concurrency
   - Intelligent URL pattern matching

3. **Crawler Engine**
   - Breadth-first search algorithm
   - Respect for robots.txt and rate limiting
   - Multiple URL pattern recognition strategies

### URL Detection Strategy

The crawler uses multiple strategies to identify product URLs:

#### Pattern-Based Detection
\`\`\`typescript
const PRODUCT_PATTERNS = [
  /\/product\//i,      // /product/item-name
  /\/item\//i,         // /item/12345
  /\/p\//i,           // /p/product-id
  /\/products\//i,     // /products/category/item
  /\/dp\//i,          // Amazon-style /dp/product-id
  /\/goods\//i,        // /goods/item-name
  /\/detail\//i,       // /detail/product-info
  /\/buy\//i,          // /buy/product-name
  // ... additional patterns
]
\`\`\`

#### Navigation Patterns
\`\`\`typescript
const NAVIGATION_PATTERNS = [
  /\/category\//i,     // Category pages
  /\/collection\//i,   // Collection pages
  /\/brand\//i,        // Brand pages
  /\/shop\//i,         // Shop sections
  // ... additional navigation patterns
]
\`\`\`

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ecommerce-crawler
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

### Basic Configuration

1. **Add Target Domains**
   - Enter one domain per line in the configuration panel
   - Ensure URLs include the protocol (https://)

2. **Set Crawling Parameters**
   - **Max Depth**: How deep to crawl (1-10 levels)
   - **Max Pages**: Maximum pages to visit per domain
   - **Concurrency**: Number of parallel requests (1-20)

3. **Start Crawling**
   - Click "Start Crawling" to begin
   - Monitor real-time progress in the results panel

### Advanced Features

#### Custom URL Patterns
Modify the `PRODUCT_PATTERNS` array in `/app/api/crawl/route.ts` to add site-specific patterns:

\`\`\`typescript
// Add custom patterns for specific sites
const CUSTOM_PATTERNS = [
  /\/your-custom-pattern\//i,
  /\/site-specific\/\d+/i
]
\`\`\`

#### Rate Limiting
The crawler includes built-in rate limiting:
- 10-second timeout per request
- Configurable concurrency limits
- Respectful crawling practices

## 📊 Output Format

Results are exported as structured JSON:

\`\`\`json
{
  "https://example.com": [
    "https://example.com/product/item-1",
    "https://example.com/product/item-2"
  ],
  "https://another-site.com": [
    "https://another-site.com/p/product-123",
    "https://another-site.com/item/product-456"
  ]
}
\`\`\`

## 🔧 Configuration Options

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| Max Depth | Maximum crawl depth | 3 | 1-10 |
| Max Pages | Pages per domain | 1000 | 10-10000 |
| Concurrency | Parallel requests | 5 | 1-20 |

## 🚦 Performance Considerations

### Optimization Strategies

1. **Intelligent Filtering**
   - Skip non-product pages early
   - Focus on navigation and product patterns
   - Avoid duplicate URL processing

2. **Memory Management**
   - Use Sets for O(1) duplicate detection
   - Stream results to prevent memory buildup
   - Garbage collection friendly patterns

3. **Network Efficiency**
   - Connection pooling
   - Timeout management
   - Graceful error handling

### Scalability Features

- **Horizontal Scaling**: Easy to distribute across multiple instances
- **Vertical Scaling**: Configurable concurrency and memory usage
- **Resource Management**: Built-in limits and monitoring

## 🛡️ Error Handling

The crawler handles various edge cases:

- **Network Timeouts**: 10-second request timeout
- **Invalid URLs**: Graceful skipping of malformed links
- **Rate Limiting**: Respectful crawling with delays
- **Memory Limits**: Configurable page limits per domain
- **Server Errors**: Retry logic and error reporting

## 🔍 Monitoring & Debugging

### Real-time Monitoring
- Live progress updates
- URL discovery statistics
- Error reporting and status tracking

### Debug Information
- Visited URL counts
- Pattern match statistics
- Performance metrics

## 📈 Supported E-commerce Platforms

The crawler is optimized for major e-commerce platforms:

- **Shopify**: `/products/`, `/collections/`
- **WooCommerce**: `/product/`, `/shop/`
- **Magento**: `/catalog/product/`
- **Custom Platforms**: Configurable patterns

### Tested Domains
- ✅ virgio.com
- ✅ tatacliq.com  
- ✅ nykaafashion.com
- ✅ westside.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the GitHub issues
2. Review the documentation
3. Create a new issue with detailed information

---

**Note**: This crawler is designed for educational and research purposes. Always respect robots.txt files and website terms of service when crawling.
