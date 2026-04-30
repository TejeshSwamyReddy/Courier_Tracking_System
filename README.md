# Courier Tracking System

A complete Courier Tracking System built with React, Tailwind CSS, Node.js, Express.js, and MongoDB-ready backend structure, plus a local preview server that runs without extra setup.

## Features

- Secure user authentication with hashed passwords and JWT-based sessions
- Separate admin login flow
- Courier booking form with sender, receiver, weight, and delivery type
- Automatic tracking ID generation
- Public shipment tracking from the homepage
- User dashboard with order history
- Admin dashboard for shipment status updates and user management
- Optional email notifications when SMTP is configured
- Responsive UI with light and dark mode

## Project Structure

```text
couriertracking system/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
  frontend/
    src/
      api/
      components/
      context/
      pages/
```

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas connection string for full Mongo mode

## Setup

1. Install dependencies from the root folder:

```bash
npm install
```

2. For the quickest local preview, you can use the included [backend/.env](</C:/Users/Dell/OneDrive/Desktop/couriertracking system/backend/.env>) file as-is.

3. If you want to switch to MongoDB mode, copy the backend environment file and update it:

```bash
cd backend
copy .env.example .env
```

Set at least these values in `backend/.env`:

- `DATA_MODE=mongo`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

4. Optional: copy the frontend environment file if you want to work on the Vite frontend directly:

```bash
cd ..\\frontend
copy .env.example .env
```

Leave `VITE_API_URL` empty for local development with the Vite proxy.

## Run the App

### Fast local preview

From the root folder:

```bash
npm run preview
```

This starts a single Express server on:

- App: `http://localhost:5173`

It uses local file storage by default, so MongoDB is not required just to preview the project.

### Full React + API development

If your machine supports Vite and you want the separate frontend development server:

```bash
npm run dev
```

This uses:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## Default Admin

On first startup, the app creates an admin account automatically using:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Use the admin login page at `http://localhost:5173/#/admin/login`.

## Main API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `GET /api/auth/me`

### Shipments

- `POST /api/shipments`
- `GET /api/shipments/mine`
- `GET /api/shipments/:shipmentId`
- `GET /api/shipments/track/:trackingId`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/shipments`
- `PATCH /api/admin/shipments/:shipmentId/status`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`

## Delivery Status Flow

- `Order Placed`
- `Picked Up`
- `In Transit`
- `Delivered`

## Email Notifications

If you add SMTP credentials in `backend/.env`, the backend will send shipment emails for:

- New booking confirmation
- Admin status updates

## Notes

- The included preview mode serves a browser app directly from Express so the project can run even when Vite is unavailable.
- Prices are calculated automatically from package weight and selected delivery type.
- Tracking IDs are unique and generated server-side.
