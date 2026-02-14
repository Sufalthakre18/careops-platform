# 🏥 CareOps - Unified Operations Platform

> **One platform to replace 5+ disconnected tools for service-based businesses**

## 🔗 Live Project Links

* **Live Website (Vercel):** [https://careops-platform-sage.vercel.app/](https://careops-platform-sage.vercel.app/)
* **GitHub Repository:** [https://github.com/Sufalthakre18/careops-platform](https://github.com/Sufalthakre18/careops-platform)
* **Video Walkthrough:** [https://drive.google.com/file/d/1NaEH84CopDTOlAZiLC-JlqsCAZwnIyDa/view?usp=sharing](https://drive.google.com/file/d/1NaEH84CopDTOlAZiLC-JlqsCAZwnIyDa/view?usp=sharing)


**CareOps** eliminates the chaos of disconnected tools by providing service businesses with one unified platform for leads, bookings, communication, forms, and inventory management.

---

## 🎯 The Problem

Service businesses today struggle with:
- **5+ disconnected tools** (leads, bookings, email, SMS, forms)
- **Missed leads** due to delayed follow-ups
- **Lost bookings** from poor communication
- **Incomplete forms** with no tracking
- **Inventory stockouts** without warning
- **Zero visibility** into operations

**Result:** Lost revenue, frustrated customers, stressed owners.

---

## ✨ The Solution

**One unified platform** where businesses can:
- ✅ Capture leads instantly
- ✅ Accept bookings 24/7 (no login required for customers)
- ✅ Communicate via email & SMS from one inbox
- ✅ Send forms automatically after bookings
- ✅ Track inventory with smart alerts
- ✅ Automate follow-ups and reminders
- ✅ Monitor everything in real-time
- ✅ Manage staff with role-based permissions

---

## 🚀 Key Features

### **For Business Owners**
- 📊 **Real-time Dashboard** - Complete visibility into operations
- 🔔 **Smart Alerts** - Know about problems before they hurt
- 🤖 **Automation Rules** - Set it and forget it
- 👥 **Staff Management** - Role-based access control
- 📈 **Analytics** - Data-driven insights

### **For Staff**
- 💬 **Unified Inbox** - All communication in one place
- 📅 **Booking Management** - Schedule and track appointments
- 📋 **Form Tracking** - Monitor completion status
- 📦 **Inventory Updates** - Real-time stock management
- ⚡ **Real-time Notifications** - Instant updates via Socket.io

### **For Customers**
- 🔗 **No Login Required** - Book via simple links
- 📧 **Automatic Confirmations** - Email confirmations instantly
- 📝 **Digital Forms** - Complete forms online
- 🔔 **Reminders** - Never miss an appointment
- 📱 **Mobile Friendly** - Book from any device

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State:** React Context API
- **Real-time:** Socket.io Client
- **Charts:** Chart.js
- **HTTP:** Axios

### **Backend**
- **Runtime:** Node.js (Express.js)
- **Language:** JavaScript (ES6+)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Authentication:** JWT
- **Validation:** Express Validator

### **Infrastructure**
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** Render PostgreSQL
- **Email:** Resend
- **Real-time:** Socket.io

### **Integrations**
- ✅ Email (Resend)
- ✅ Google Calendar
- ✅ Socket.io (Real-time)
- 🔜 SMS (Twilio)
- 🔜 Webhooks

---

## 📦 Installation

### **Prerequisites**
- Node.js 18+
- PostgreSQL database
- npm or yarn

### **Backend Setup**

```bash
# Clone repository
git clone https://github.com/yourusername/careops-platform.git
cd careops-platform/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your credentials:
DATABASE_URL="postgresql://user:password@localhost:5432/careops"
JWT_SECRET="your-super-secret-jwt-key"
CORS_ORIGIN="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start server
npm run dev
```

Backend runs on `http://localhost:5000`

### **Frontend Setup**

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Update .env.local
NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 🌐 Deployment

### **Backend (Render)**

1. Create Render account
2. Create Web Service from GitHub repo
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
5. Deploy! ✅

### **Frontend (Vercel)**

1. Import GitHub repository to Vercel
2. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `./frontend` (if applicable)
3. Add environment variable:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
4. Deploy! ✅

---

## 📚 API Documentation

### **Authentication**
```bash
# Register
POST /api/auth/register
Body: { email, password, firstName, lastName, businessName }

# Login
POST /api/auth/login
Body: { email, password }

# Get Current User
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### **Bookings**
```bash
# Get Booking Types (Public)
GET /api/bookings/types?workspaceId=<id>

# Get Available Slots (Public)
GET /api/bookings/types/:id/available-slots?date=YYYY-MM-DD

# Create Booking (Public)
POST /api/bookings
Body: { workspaceId, bookingTypeId, scheduledAt, customerName, customerEmail, customerPhone }

# Get All Bookings (Private)
GET /api/bookings
Headers: { Authorization: "Bearer <token>" }
```

### **Inbox**
```bash
# Get Conversations
GET /api/conversations
Headers: { Authorization: "Bearer <token>" }

# Send Message
POST /api/conversations/:id/messages
Headers: { Authorization: "Bearer <token>" }
Body: { body, channel, direction }
```

### **Forms**
```bash
# Get Forms
GET /api/forms
Headers: { Authorization: "Bearer <token>" }

# Create Form
POST /api/forms
Headers: { Authorization: "Bearer <token>" }
Body: { name, description, fields }
```

### **Inventory**
```bash
# Get Inventory Items
GET /api/inventory
Headers: { Authorization: "Bearer <token>" }

# Update Quantity
PUT /api/inventory/:id/quantity
Headers: { Authorization: "Bearer <token>" }
Body: { quantity, reason }
```

---

## 🔄 Automation Rules

CareOps includes powerful automation:

| Trigger | Action | Description |
|---------|--------|-------------|
| `NEW_CONTACT` | Send Email | Welcome message to new contacts |
| `BOOKING_CREATED` | Send Email | Booking confirmation |
| `BOOKING_REMINDER` | Send Email | 24h before appointment |
| `FORM_PENDING` | Send Email | Reminder to complete form |
| `FORM_OVERDUE` | Create Alert | Alert staff about overdue forms |
| `INVENTORY_LOW` | Create Alert | Alert when stock is low |

---

## 📊 Database Schema

### **Core Models**
- **User** - Staff and owners
- **Workspace** - Business account
- **Contact** - Customers and leads
- **Booking** - Appointments
- **BookingType** - Service definitions
- **Conversation** - Communication threads
- **Message** - Individual messages
- **Form** - Digital forms
- **FormSubmission** - Completed forms
- **InventoryItem** - Stock tracking
- **Alert** - Notifications
- **AutomationRule** - Automation config

---

## 🎨 Features Showcase

### **1. Smart Dashboard**
- Today's bookings at a glance
- New leads and conversations
- Pending forms tracking
- Inventory alerts
- Real-time updates

### **2. Public Booking**
- No customer login required
- Beautiful booking interface
- Real-time availability
- Instant confirmations
- Mobile responsive

### **3. Unified Inbox**
- Email and SMS in one place
- Full conversation history
- Rich text editor
- Automated responses
- Staff assignments

### **4. Form Builder**
- Drag-and-drop interface
- Custom fields
- Conditional logic
- Auto-send after booking
- Completion tracking

### **5. Inventory Management**
- Real-time stock levels
- Low stock alerts
- Usage tracking
- Vendor information
- Reorder automation

### **6. Staff Management**
- Role-based permissions
- Activity tracking
- Performance metrics
- Invitation system
- Access control

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Environment variables
- ✅ Secure headers

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📈 Performance

- **Frontend:** Optimized with Next.js App Router
- **Backend:** Efficient database queries with Prisma
- **Real-time:** Socket.io for instant updates
- **Caching:** Strategic caching for API responses
- **CDN:** Static assets via Vercel Edge Network

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Environment Variables

### **Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# Server
PORT=5000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="CareOps"

# Optional: AI
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxx"

# Optional: Frontend URL (for emails)
FRONTEND_URL="http://localhost:3000"
```

### **Frontend (.env.local)**
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

---

## 🎯 Roadmap

### **Phase 1: Core Features** ✅
- [x] User authentication
- [x] Booking system
- [x] Inbox/messaging
- [x] Form builder
- [x] Inventory tracking
- [x] Basic automation

### **Phase 2: Integrations** 🔄
- [x] Email (Resend)
- [x] Google Calendar
- [x] Real-time (Socket.io)
- [ ] SMS (Twilio)
- [ ] Zapier webhooks
- [ ] Stripe payments

### **Phase 3: Advanced Features** 📋
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics
- [ ] Custom branding
- [ ] Multi-location support
- [ ] API marketplace
- [ ] White-label solution

---

## 🐛 Known Issues

- Email delivery may be delayed on free tier
- Socket.io reconnection on network change
- Mobile UI optimizations in progress

---

## **Built by:** SUFAL THAKRE
**Contact:** sufalthakre4@gmail.com

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Vercel for hosting and deployment
- Render for backend infrastructure
- Resend for email services
- All open-source contributors


---

## ⭐ Star Us!

If you find CareOps useful, please consider giving us a star on GitHub! ⭐

---

## 🎉 Demo

**Live Demo:** https://careops-platform-sage.vercel.app

**Test Credentials:**
- Email: `demo@careops.com`
- Password: `Demo123!`

**Public Booking:** https://careops-platform-sage.vercel.app/book/[workspace-id]

---

<div align="center">

**Made with ❤️ for service businesses everywhere**


</div>