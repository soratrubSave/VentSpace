# 🌌 VentSpace

เว็บแอปพลิเคชันสำหรับระบายความรู้สึกแบบ Anonymous Real-time Chat Platform

## 📋 เกี่ยวกับโปรเจค

VentSpace เป็นแพลตฟอร์มที่ให้ผู้ใช้สามารถโพสต์และระบายความรู้สึกได้แบบไม่ระบุตัวตน พร้อมระบบ Real-time Voting และ Comment ที่ใช้ Socket.IO

### ✨ Features

- ✅ **Real-time Communication** - ใช้ Socket.IO สำหรับการสื่อสารแบบ Real-time
- ✅ **Anonymous Posting** - โพสต์ข้อความได้โดยไม่ต้องระบุตัวตน
- ✅ **Voting System** - ระบบโหวต Agree/Disagree พร้อม Smart Toggle
- ✅ **Comments** - คอมเมนต์แบบ Real-time
- ✅ **Modern UI** - ดีไซน์สวยงามด้วย Tailwind CSS
- ✅ **Input Validation** - ตรวจสอบความยาวข้อความ (Post: 500 chars, Comment: 300 chars)
- ✅ **Loading & Empty States** - UX ที่ดีขึ้นด้วย Loading และ Empty states
- ✅ **Timestamps** - แสดงเวลาที่โพสต์และคอมเมนต์

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Socket.IO, TypeScript
- **Database**: MongoDB
- **DevOps**: Docker Compose

## 🚀 การติดตั้งและรันโปรเจค

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

1. **Clone repository**
   ```bash
   git clone <your-repo-url>
   cd VentSpace
   ```

2. **ตั้งค่า Environment Variables**

   สร้างไฟล์ `.env` ใน `server/` จาก `.env.example`:
   ```bash
   cd server
   cp .env.example .env
   ```
   
   สร้างไฟล์ `.env.local` ใน `client/` จาก `.env.example`:
   ```bash
   cd ../client
   cp .env.example .env.local
   ```

3. **รัน MongoDB ด้วย Docker Compose**
   ```bash
   # จาก root directory
   docker-compose up -d
   ```
   
   MongoDB จะรันที่ `localhost:27017`
   Mongo Express (Admin UI) จะรันที่ `http://localhost:8081`

4. **ติดตั้ง Dependencies และรัน Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   
   Server จะรันที่ `http://localhost:3001`

5. **ติดตั้ง Dependencies และรัน Client** (เปิด Terminal ใหม่)
   ```bash
   cd client
   npm install
   npm run dev
   ```
   
   Client จะรันที่ `http://localhost:3000`

6. **เปิดเบราว์เซอร์**
   ```
   http://localhost:3000
   ```

## 📁 โครงสร้างโปรเจค

```
VentSpace/
├── client/                 # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx       # หน้าหลัก
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── .env.example
│   └── package.json
├── server/                 # Express Backend
│   ├── src/
│   │   └── index.ts       # Server entry point
│   ├── .env.example
│   └── package.json
├── docker-compose.yml      # MongoDB & Mongo Express
└── README.md
```

## 🔧 Scripts

### Server
- `npm run dev` - รัน development server (nodemon)
- `npm run build` - Build TypeScript
- `npm start` - รัน production server

### Client
- `npm run dev` - รัน development server
- `npm run build` - Build production
- `npm start` - รัน production server
- `npm run lint` - Run ESLint

## 📝 Environment Variables

### Server (.env)
```env
MONGO_URI=mongodb://root:password123@localhost:27017/ventspace_db?authSource=admin
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Features ที่จะพัฒนาต่อ

- [ ] ระบบ Authentication (Login/Register)
- [ ] User Profiles และ Dashboard
- [ ] Tag/Emotion System (#เหงา #ท้อ #ดีใจ)
- [ ] Private Posts (Diary mode)
- [ ] Analytics Dashboard (กราฟอารมณ์)
- [ ] Search & Filter
- [ ] Image Upload
- [ ] Notification System

## 📸 Screenshots

_(เพิ่ม screenshots ของแอปได้ที่นี่)_

## 🤝 Contributing

Pull requests are welcome! สำหรับโปรเจคส่วนตัวนี้

## 📄 License

ISC

---

Made with ❤️ for Portfolio Project
