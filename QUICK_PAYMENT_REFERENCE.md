# FLA Payment Flow - Quick Reference

## 🛍️ **CUSTOMER FLOW** (Simple 6 Steps)

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Browse & Choose Your Fashion Item                   │
│  👗 Select the product you love                              │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Sign In or Register                                 │
│  👤 Create account (so you can track your order!)            │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Select Size & Payment Method                        │
│  📏 Choose size: S, M, L, XL                                 │
│  💳 Choose: MTN, Vodafone, or AirtelTigo                     │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Make Mobile Money Payment                           │
│  📱 Send money to vendor's number                            │
│  📸 Take screenshot of confirmation                          │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 5: Upload Screenshot                                   │
│  📤 Upload your payment proof                                │
│  ✅ Submit order                                             │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 6: Track Your Order                                    │
│  📊 See status in your dashboard:                            │
│     ⏰ Pending Vendor Confirmation                           │
│     ✅ Payment Verified                                      │
│     🏭 In Production                                         │
│     🚚 Shipped                                               │
│     ✅ Delivered                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 👔 **VENDOR FLOW** (Simple 4 Steps)

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Get Notification                                    │
│  🔔 New payment to verify!                                   │
│  ⏰ Timer starts: 30 minutes to respond                      │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: View Payment Proof                                  │
│  👁️ Click "View Proof" button                               │
│  📸 See customer's payment screenshot                        │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Check Your Mobile Money                             │
│  💰 Open MTN/Vodafone/AirtelTigo app                         │
│  ✅ Confirm you received the money                           │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Confirm Payment                                     │
│  ✅ Click "Confirm Payment" button                           │
│  🎉 Order moves to production!                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⏰ **TIMER SYSTEM** (What the Colors Mean)

```
┌─────────────────────────────────────────────────────────┐
│  🟢 GREEN (20-30 minutes left)                          │
│     "You have plenty of time"                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🟠 ORANGE (10-20 minutes left)                         │
│     "Please check soon"                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔴 RED (0-10 minutes or OVERDUE)                       │
│     "URGENT - Check now!"                               │
└─────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 **ADMIN VIEW** (What You See)

```
┌──────────────────────────────────────────────────────────────┐
│  ORDERS TABLE - New "Vendor Verification" Column             │
├──────────────────────────────────────────────────────────────┤
│  Order #123456                                               │
│  ✅ Verified (2:15 PM) ← Vendor confirmed quickly            │
├──────────────────────────────────────────────────────────────┤
│  Order #123457                                               │
│  ⏰ Awaiting Vendor (Submitted 2:00 PM) ← Still waiting      │
├──────────────────────────────────────────────────────────────┤
│  Order #123458                                               │
│  ❌ No Proof ← Customer hasn't uploaded yet                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 **COMPLETE TIMELINE EXAMPLE**

```
2:00 PM  📸 Customer uploads payment screenshot
         └─→ System records: "Payment Submitted"

2:01 PM  🔔 Vendor gets notification
         └─→ Timer starts: 29:59... 29:58... 29:57...

2:10 PM  👁️ Vendor views payment proof
         └─→ Timer: 20:00 remaining (still green)

2:15 PM  ✅ Vendor confirms payment
         └─→ System updates everything:
             • Payment Verified ✅
             • Order Status: "Confirmed"
             • Customer notified
             • Production can start

2:16 PM  🏭 Production begins
         └─→ Customer sees: "In Production"
```

---

## ⚠️ **IMPORTANT RULES**

### For Customers:
- ✅ **Must create account** (no guest checkout)
- ✅ **Take clear screenshot** of payment
- ✅ **Check dashboard** for order status

### For Vendors:
- ✅ **Respond within 30 minutes**
- ✅ **Only confirm if money received**
- ✅ **Check amount matches** order total

### For Admins:
- ✅ **Monitor vendor response times**
- ✅ **Help resolve disputes**
- ✅ **Track platform health**

---

## 🎯 **KEY BENEFITS**

```
┌─────────────────────────────────────────────────────────┐
│  FOR CUSTOMERS:                                         │
│  ✅ Track orders anytime                                │
│  ✅ Know when payment is verified                       │
│  ✅ See real-time status updates                        │
│  ✅ No lost orders                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FOR VENDORS:                                           │
│  ✅ Clear payment verification dashboard                │
│  ✅ See all pending confirmations                       │
│  ✅ Easy one-click confirmation                         │
│  ✅ Build trust with fast responses                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FOR ADMINS:                                            │
│  ✅ Complete oversight of all payments                  │
│  ✅ Identify vendor performance                         │
│  ✅ Resolve disputes with timestamps                    │
│  ✅ Monitor platform health                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 **QUICK SUPPORT**

- **Customers:** Dashboard → Help & Support
- **Vendors:** vendor-dashboard → Help
- **Email:** support@fla.com
- **WhatsApp:** +233 50 511 2925

---

## 🚀 **GETTING STARTED**

### Customers:
1. Go to website
2. Click "Sign Up"
3. Start shopping!

### Vendors:
1. Go to `/vendor-dashboard`
2. Log in
3. Start confirming payments!

### Admins:
1. Go to `/admin`
2. Monitor everything!

---

**Simple. Secure. Transparent.** ✨
