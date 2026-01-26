# Educational Web Proxy Framework

An educational tool for developers to learn about HTTP proxy architecture, URL encoding, session management, and request forwarding.

## 📚 What You'll Learn

This project demonstrates essential web development concepts:

- **HTTP Request Flow** - How requests travel from client to server through intermediaries
- **URL Encoding** - Safe data transmission using Base64 and URL-safe encoding
- **Session Management** - Tracking user connections with server-side state
- **Error Handling** - Comprehensive error processing with user-friendly messages
- **Proxy Architecture** - How forward proxies forward requests and modify responses

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Open in browser
# Visit http://localhost:3000
```

## 📁 Project Structure

```
proxy/
├── server.js                    # Main Express server (start here!)
├── package.json                 # Project dependencies
├── public/                      # Frontend files
│   ├── index.html               # Main HTML page
│   ├── css/styles.css           # Styling
│   └── js/app.js                # Frontend logic
└── src/
    ├── handlers/
    │   └── proxyHandler.js      # Core proxy logic
    ├── middleware/
    │   ├── errorHandler.js      # Error processing
    │   └── sessionManager.js    # Session tracking
    └── utils/
        └── urlEncoder.js        # URL encoding utilities
```

## 🔧 How It Works

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Browser   │────▶│  Proxy Server│────▶│ Target Website│
│   (You)     │◀────│  (localhost) │◀────│  (example.com)│
└─────────────┘     └──────────────┘     └───────────────┘
```

1. **You enter a URL** in the interface
2. **The URL is encoded** (Base64) for safe transmission
3. **The proxy server receives** your request
4. **The proxy fetches** content from the target website
5. **Headers are processed** (some removed for embedding)
6. **Content is returned** and displayed in the viewer

## 📖 Educational Code Comments

Every file in this project is heavily commented to explain:
- What each section does
- Why certain decisions were made
- How the code relates to web standards
- Common patterns and best practices

Start reading from `server.js` and follow the imports to understand the full flow.

## 🛡️ Security Considerations

This is an **educational project**. In production, you would need:
- Rate limiting
- URL allowlists/blocklists
- Authentication
- HTTPS enforcement
- Request size limits
- Logging and monitoring

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/session` | GET | Get current session info |
| `/api/encode` | POST | Encode a URL (Base64) |
| `/api/decode` | POST | Decode an encoded URL |
| `/api/proxy` | GET/POST | Fetch content through proxy |

## 🎓 Next Steps

After understanding this project, explore:
- Reverse proxies (Nginx, HAProxy)
- HTTP/2 and HTTP/3 protocols
- WebSocket proxying
- Load balancing
- CDN architecture

---

*Built for educational purposes. Learn responsibly!*
