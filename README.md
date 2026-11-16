# 🦜 Cockatiel

A modern, high-performance real-time messaging and voice/video calling mobile application built with **React Native (Expo New Architecture)** and **Node.js (Fastify + Mongoose 8 + Socket.IO)**.

## 📁 Project Structure

```
cockatiel/
├── frontend/             # React Native (Expo SDK 52+, New Architecture) mobile app
├── backend/              # Node.js + Fastify + Mongoose 8 + Socket.IO server
├── resources/            # Design mockups, UI screenshots, and specifications
├── PLANNING.md           # Master architecture and technical planning document
└── README.md             # Project overview
```

## 🚀 Cutting-Edge Technology Stack

- **Frontend:**
  - React Native (Expo SDK 52) with **New Architecture (Bridgeless Mode)**
  - Expo Router v4 (Typed file-based navigation)
  - TypeScript 5 (Strict Mode)
  - NativeWind (Tailwind CSS v4)
  - Lucide React Native Icons
  - LiveKit Client SDK (Modern low-latency audio/video calling)
- **Backend:**
  - Node.js LTS (ES Modules)
  - **Fastify** (2-3x faster than Express with async-first architecture)
  - **MongoDB Atlas + Mongoose 8** (Type-safe schemas and documents)
  - **Socket.IO v4** (Pure WebSocket transport for real-time messaging & presence)
  - **Zod** (Runtime validation & type safety)
  - **Cloudinary** (Media CDN for chat photos & avatars)
  - **LiveKit Server** (Real-time voice & video calling engine)

## 📖 Master Architecture & Roadmap

For complete database schemas, real-time WebSocket contracts, UI mappings, and step-by-step roadmap, read [PLANNING.md](PLANNING.md).
