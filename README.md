# Real-Time Workspace Chat Application

A high-performance, visually polished real-time chat application built using **React** with **Tailwind CSS** and **TypeScript** on the frontend, and a **Node.js + Express + Socket.io** backend. 

Messages are persistent across page refreshes and server restarts, and are synchronized instantly using bidirectional WebSockets.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [npm](https://www.npmjs.com/) (v9.x or higher)

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd react-example
   ```

2. Install all required dependencies (this installs both frontend and backend packages):
   ```bash
   npm install
   ```

### Running the Application

This is a cohesive full-stack application configured to run both frontend Vite assets and the Express backend on a single port (**3000**) using Vite middleware:

#### Development Mode
To boot up the integrated server (Express + Socket.io + Vite in-memory server with live reloading):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

#### Production Build & Start
To bundle the frontend assets and compile the Express server into a standalone executable package:
```bash
# 1. Build the frontend and backend server files
npm run build

# 2. Run the bundled Node production server
npm run start
```
The application will be live at `http://localhost:3000`.

---

## 🐳 Environment Variables

A `.env.example` file is included in the project root. Create a `.env` file in the same directory:

```env
# GEMINI_API_KEY: Optional if you decide to extend AI services
GEMINI_API_KEY="your-api-key-here"

# APP_URL: The self-referential production URL
APP_URL="http://localhost:3000"
```

---

## 🛠️ Design Decisions

1. **Integrated Port Architecture (Single Port 3000)**
   - Instead of running a frontend server on port 5173 and a backend server on port 3001 (which causes CORS friction and complex cookie routing), the application mounts **Vite as an Express middleware** during development.
   - In production, it compiles the backend `server.ts` into a fast, static-file-serving Node process `dist/server.cjs` and hosts the frontend SPA directly.
   - This ensures 100% reliable proxying, simplifies WebSocket handshakes, and allows seamless container ingress deployment.

2. **Zero-Overhead Local Database (`db.json`)**
   - For persistent chat history, rather than introducing heavy external dependencies like MongoDB or SQLite (which often cause native C++ compilation errors in cloud runner boxes), we implemented a customized file-based JSON store in `src/server-db.ts`.
   - It is fully typed, supports atomic writes, automatically filters/sanitizes duplicate message IDs (idempotency guards), and persists data directly to the working directory.

3. **Hybrid Message Ingestion (REST + Socket.io Broadcast)**
   - **REST API** (`POST /api/messages`): Handles message ingestion and verification.
   - **Socket.io** (`new_message` broadcast): Broadcasts incoming messages immediately to all connected clients.
   - This guarantees that HTTP client logs, schema validators, and WebSocket broadcasters operate under a single, highly resilient hybrid lifecycle.

4. **Premium Presence & Polish Indicators**
   - **Dynamic Color Avatars**: Computes deterministic initials and custom background colors based on usernames.
   - **Double Checkmark Statuses**: Includes message read receipt handshakes (`mark_read` and `messages_read` socket notifications) showing single checkmarks (`✓` sent) and double blue checkmarks (`✓✓` read).
   - **Throttled Typing Indicators**: Detects typing patterns on keystroke inputs and notifies teammates dynamically.

---

## 🧐 Assumptions Made

- **General Channel Focus**: The current design centers around a shared group chat workspace room (`# general`), which aligns perfectly with standard quick real-time messaging tests.
- **Offline Resiliency**: We assume client connections can be brief or spotty. The application has built-in connection banners, auto-reconnection parameters, and error handlers that gracefully cache state locally during interruptions.
- **Session Persistence**: Username states are persisted in `localStorage` to bypass logins on consecutive page visits, and messages are backed up immediately in a server-side JSON database file (`db.json`).
