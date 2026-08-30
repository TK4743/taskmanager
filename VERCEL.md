# ⚡ Vercel Deployment Reference

<div align="center">

[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://it-taskmanager.vercel.app/)
[![Production URL](https://img.shields.io/badge/Live_Site-it--taskmanager.vercel.app-blue?style=for-the-badge)](https://it-taskmanager.vercel.app/)

</div>

> **Notice:** This repository is specifically dedicated and configured for **Vercel** cloud hosting and production deployments.

### 🌐 Live Production URL
👉 **[https://it-taskmanager.vercel.app/](https://it-taskmanager.vercel.app/)**

---

### 📂 Vercel Deployment Resources in this Repository
- **[`vercel.json`](./vercel.json)**: Core Vercel configuration file containing build commands, serverless limits (1536 MB RAM, 30s timeout), region routing (`bom1` Mumbai), immutable asset caching rules, and SPA rewrite definitions.
- **[`vercel/`](./vercel/)**: Dedicated deployment documentation folder containing the full architecture overview, environment variable specifications, and deployment runbooks:
  - 👉 [View Detailed Vercel Documentation (`vercel/README.md`)](./vercel/README.md)
- **[`api/index.ts`](./api/index.ts)**: Serverless function bridge connecting Vercel's edge network directly to the Express application handler.

---

### 🛠️ Build & Run Specifications
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Runtime**: 18.x / 20.x
- **Target Edge Region**: `bom1` (Mumbai, India)
