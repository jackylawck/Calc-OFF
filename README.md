# Calc-OFF | 離線算籌

> **運算於手，運籌帷幄。**  
> **Calculations in Hand. Absolute Command.**

Calc-OFF 是一款輕量、純前端且支援離線執行的科學計算機 Web PWA 應用程式。專為重視計算精準度與記憶體隱私安全（Zero-Trace Privacy）的專業人士設計。

---

## 繁體中文

### 📖 簡介
Calc-OFF 結合了Casio風格的標準科學計算介面與零痕跡記憶體（RAM-Only）暫存機制。所有數據均在用戶終端瀏覽器本地處理，不依賴任何外部伺服器或資料庫。

### ✨ 主要功能
- **完整科學計算功能**：支援三角函數（`sin`, `cos`, `tan`）、對數（`log`, `ln`）、次方（`xʸ`）、開號（`√`）、圓周率（`π`）及獨立負數鍵（`(-)`）。
- **離線優先 (Offline-First PWA)**：支援安裝至 iOS / Android 主畫面及 Desktop，全功能皆可在無網路連結下順暢運作。
- **記憶體零痕跡機制 (RAM-Only Session)**：
  - 暫存資料僅保留於運行記憶體（RAM）中，絕不寫入 LocalStorage、IndexedDB 或 Cookie。
  - 切換 App 至背景、關閉分頁或閒置滿 5 分鐘，系統將自動覆寫並銷毀記憶體數據。
- **企業級 CSP 防護**：啟用嚴格的 Content Security Policy，徹底排除未授權的網路數據傳輸。

### 🚀 快速開始
造訪 GitHub Pages 部署連結即可直接使用或新增至主畫面：  
👉 [https://jackylawck.github.io/Calc-OFF/](https://jackylawck.github.io/Calc-OFF/)

---

## English

### 📖 Overview
Calc-OFF is a sleek, privacy-focused Progressive Web Application (PWA) designed for precise scientific computation and zero-trace session data management. It operates strictly client-side within the local browser context without external server dependencies.

### ✨ Key Features
- **Comprehensive Scientific Functions**: Supports trigonometric functions (`sin`, `cos`, `tan`), logarithmic functions (`log`, `ln`), exponentiation (`xʸ`), square roots (`√`), constants (`π`), and explicit negation (`(-)`).
- **Offline-First PWA Architecture**: Fully installable on iOS, Android, and Desktop platforms with Service Worker caching for seamless offline usability.
- **Zero-Trace RAM Vault**:
  - Transient data resides exclusively in volatile memory (RAM)—never written to LocalStorage, IndexedDB, or Cookies.
  - Automatic memory purge triggered upon page unload, app backgrounding, or after 5 minutes of idle inactivity.
- **Enterprise CSP Compliance**: Configured with strict Content Security Policy meta-headers to prevent unauthorized data exfiltration.

### 🚀 Quick Start
Launch the live application directly from GitHub Pages:  
👉 [https://jackylawck.github.io/Calc-OFF/](https://jackylawck.github.io/Calc-OFF/)

---

## 🛠️ Tech Stack / 技術棧
- **Frontend**: HTML5, Modern CSS3, JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest
- **Security**: SubtleCrypto API (SHA-256), Strict CSP
- **Deployment**: GitHub Pages
