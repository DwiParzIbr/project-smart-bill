# Smart Bill & Receipt Splitter (Bagi Tagihan Pintar) 🧾✨

A modern, mobile-first Progressive Web App (PWA) designed to eliminate the awkwardness and hassle of splitting bills (*patungan*). Built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, and powered by **Google Gemini AI Vision** with offline-ready **Tesseract.js OCR**.

---

## 🌟 Key Features

1. **AI Vision Receipt Scanner (OCR)**
   - **Google Gemini Multimodal AI**: Automatic model cascade (`3.5 Flash-Lite` ➔ `3.6 Flash` ➔ `3.8 Flash` ➔ `3.1 Pro`).
   - **Client-Side Fallback Engine**: Built-in `Tesseract.js` with image preprocessing (contrast enhancement & grayscale).
   - **Multi-Format Receipt Parser**: Seamlessly recognizes thermal receipts, POS systems (Pawoon, Moka, etc.), and retail minimarkets (Alfamart, Indomaret).
   - **Interactive Receipt Previewer**: Pinch-to-zoom and pan receipts directly from the interface.

2. **Fair & Flexible Bill Splitting**
   - **Equal Split**: Split items evenly across all or selected participants.
   - **Exact Shares & Custom Allocation**: Support for differing consumption portions and fixed amounts.
   - **Indonesian Tax & Service Calculation**: Proportional distribution of PB1/PPN (10-11%), service charges, tips, and discounts.
   - **Discrepancy Checker**: Real-time validation verifying sum of items against grand total.

3. **Settlement & Sharing**
   - **Summary Cards**: Clear per-person breakdown showing individual food items, tax, and total amount.
   - **WhatsApp Text Formatter**: 1-click copy formatted WhatsApp message ready to share with friends.
   - **Local Bill History**: Save, revisit, and manage previous bills offline.

4. **Mobile-First PWA Experience**
   - Installable on iOS (Safari) and Android (Chrome).
   - Modern Glassmorphism UI with smooth spring animations.
   - Full keyboard accessibility and minimum 44px mobile touch targets.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Webpack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **OCR & AI**: Google Gemini API Vision + [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Database / ORM**: [Prisma](https://www.prisma.io/) + SQLite
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DwiParzIbr/smart-bill.git
   cd smart-bill
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations (Optional / Local SQLite)**:
   ```bash
   npx prisma generate
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   - Local: [http://localhost:3000](http://localhost:3000)
   - Network (Mobile on same Wi-Fi): `http://<YOUR_LOCAL_IP>:3000`

---

## 🧪 Testing

Run unit tests covering calculations and receipt parsers:
```bash
npm run test
```

Build for production:
```bash
npm run build
```

---

## 📄 License
MIT License. Created by [Dwi Fariz Parizza Ibrahim](https://github.com/DwiParzIbr).
