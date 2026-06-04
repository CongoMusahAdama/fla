# FLA Logistics - Fashion E-Commerce Platform

A full-stack e-commerce platform for fashion vendors and customers with real-time order management, payment processing, and email verification.

## 🚀 Features

- **Multi-Vendor Support**: Vendors can register, add products, and manage orders
- **Payment Integration**: Mobile Money (MTN, Telecel, Tigo) with screenshot verification
- **Email Verification**: OTP-based vendor verification using Brevo
- **Order Management**: Real-time order tracking and status updates
- **Product Management**: Image uploads, size variants, inventory tracking
- **User Dashboard**: Separate dashboards for customers and vendors
- **Wishlist & Cart**: Full shopping cart and wishlist functionality

## 📦 Tech Stack

### Backend
- **NestJS** - Node.js framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Brevo (Sendinblue)** - Email service
- **Multer** - File uploads

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SweetAlert2** - Beautiful modals
- **Context API** - State management

## 🛠️ Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
PORT=3001
```

5. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Start development server:
```bash
npm run dev
```

## 🌐 Deployment

### Backend Deployment (Render)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: fla-backend
   - **Environment**: Node
   - **Root Directory**: `backend` (required)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
6. Add Environment Variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `FRONTEND_URL` (your frontend URL)
   - `PORT` (3001)
7. Click "Create Web Service"

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
6. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)
7. Click "Deploy"

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3001
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

## 🔑 Getting API Keys

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string

### Brevo (Email Service)
1. Go to [Brevo](https://app.brevo.com)
2. Sign up for free account
3. Go to Settings → SMTP & API → API Keys
4. Create new API key

## 📱 Features Overview

### For Customers
- Browse products by category
- Add to cart and wishlist
- Checkout with MoMo payment
- Upload payment proof
- Track orders
- View order history

### For Vendors
- Email verification with OTP
- Add/edit/delete products
- Upload product images
- Set multiple payment methods
- View and manage orders
- Dashboard with analytics
- Withdrawal requests

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **FLA Team** - Initial work

## 🙏 Acknowledgments

- Brevo for email services
- MongoDB for database
- Render for backend hosting
- Vercel for frontend hosting
