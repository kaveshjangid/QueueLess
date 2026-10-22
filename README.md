# QueueLess — Virtual Queue Management System

A full-stack MVP for managing virtual queues at colleges, clinics, salons, and service counters.

## Features
- JWT authentication with `customer`, `staff`, and `admin` roles
- Customer dashboard to join a service queue, view token and waiting estimate, and cancel a waiting token
- Staff dashboard to call the next token, mark a token served, skip a token, and pause/resume a service queue
- Admin dashboard to create services and view daily queue stats
- Socket.IO live queue updates
- Unique daily token numbers per service
- Server-side validation and role checks
- MongoDB persistence

## Stack
- Frontend: React + Vite + React Router + Socket.IO Client
- Backend: Node.js + Express + Mongoose + Socket.IO + JWT + bcryptjs

## Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## 1. Start the backend
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```
The API runs at `http://localhost:5000`.

Edit `server/.env` and set `MONGODB_URI` and `JWT_SECRET` if needed.

## 2. Start the frontend
In a second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Open the Vite URL, normally `http://localhost:5173`.

## Demo accounts
The seed script creates:
- Admin: `admin@queueless.local` / `QueueLess123!`
- Staff: `staff@queueless.local` / `QueueLess123!`
- Customer: `customer@queueless.local` / `QueueLess123!`

Change these credentials and the JWT secret before deploying publicly.

## Important notes
- This is a learning MVP, not a production-ready system.
- For production, add rate limiting, stronger account policies, email verification/password reset, structured logging, monitoring, CSRF strategy if using cookies, and a transactional/atomic token allocation strategy for high concurrency.
- The app uses a MongoDB counter document updated atomically to reduce duplicate daily token numbers.
- Waiting time is an estimate based on people ahead and the service's configured average minutes per customer.
- Socket.IO rooms are authorized by role and service subscription in this MVP; production deployments should add stronger room-level authorization and audit logging.

## Main API endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/services`
- `POST /api/services` (admin)
- `GET /api/queue/my` (customer)
- `POST /api/queue/join` (customer)
- `PATCH /api/queue/:id/cancel` (customer)
- `GET /api/queue/service/:serviceId` (staff/admin)
- `POST /api/queue/:serviceId/next` (staff/admin)
- `PATCH /api/queue/:id/serve` (staff/admin)
- `PATCH /api/queue/:id/skip` (staff/admin)
- `PATCH /api/queue/service/:serviceId/pause` (staff/admin)
- `GET /api/analytics/summary` (admin)

## Project structure
```text
QueueLess/
  client/
    src/
      components/
      context/
      pages/
      api.js
      App.jsx
      main.jsx
      styles.css
  server/
    src/
      middleware/
      models/
      routes/
      socket.js
      app.js
      server.js
      seed.js
```
