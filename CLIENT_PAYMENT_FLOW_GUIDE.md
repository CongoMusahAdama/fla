# FLA Payment Flow - Client Guide

## 🎯 Overview
This document explains how the payment verification system works on the FLA platform to ensure secure transactions between customers and vendors.

---

## 📱 **For Customers: How to Make a Purchase**

### Step 1: Browse & Select Product
- Visit the FLA shop
- Browse beautiful bespoke fashion items
- Click on any product you like

### Step 2: Create an Account (Required)
**Why?** So you can track your order and see its status anytime!

- Click "Add to Cart" or "Buy Now"
- If not logged in, you'll be prompted to **Sign In or Register**
- Create your account with:
  - Name
  - Email
  - Password
  - Phone number

### Step 3: Choose Size & Payment Method
- Select your size (S, M, L, XL, etc.)
- Choose payment method:
  - MTN Mobile Money
  - Vodafone Cash
  - AirtelTigo Money

### Step 4: Make Payment
1. **Copy the vendor's mobile money number** (shown on screen)
2. **Open your mobile money app** (MTN, Vodafone, or AirtelTigo)
3. **Send the exact amount** to the vendor's number
4. **Take a screenshot** of the successful payment confirmation

### Step 5: Upload Payment Proof
- Click "Upload Screenshot"
- Select the payment screenshot from your phone
- Click "Submit Order"

### Step 6: Track Your Order
- You'll be **automatically redirected to your Dashboard**
- See your order status:
  - ⏰ "Pending Vendor Confirmation" (Vendor is checking payment)
  - ✅ "Payment Verified" (Vendor confirmed - Production starts!)
  - 📦 "In Production" (Your item is being made)
  - 🚚 "Shipped" (On the way to you)
  - ✅ "Delivered" (Enjoy your fashion!)

---

## 👔 **For Vendors: How to Confirm Payments**

### Access Your Vendor Dashboard
- Go to: `www.yoursite.com/vendor-dashboard`
- Log in with your vendor account

### You'll See:
1. **Pending Payment Verifications** section
   - All orders waiting for your confirmation
   - Each order shows:
     - Customer name
     - Order amount
     - Payment method used
     - **Countdown timer** (30 minutes to respond)

### Countdown Timer Colors:
- 🟢 **Green** (20-30 minutes left) - You have time
- 🟠 **Orange** (10-20 minutes left) - Please check soon
- 🔴 **Red** (0-10 minutes or overdue) - URGENT!

### How to Verify Payment:

1. **Click "View Proof"** button
   - See the customer's payment screenshot
   - Verify the amount matches
   - Check the transaction was to your number

2. **Check Your Mobile Money Account**
   - Open your MTN/Vodafone/AirtelTigo app
   - Confirm you received the money

3. **Click "Confirm Payment"** button
   - System asks: "Have you received this payment?"
   - Click "Yes, Payment Received"

4. **Done!**
   - Customer gets notified
   - Order moves to production
   - You can start working on the item

### ⚠️ Important Rules:
- **Respond within 30 minutes** of payment submission
- **Only confirm if you actually received the money**
- **Check the amount matches** before confirming

---

## 👨‍💼 **For Admins: Monitoring the System**

### Admin Dashboard Overview
Access: `www.yoursite.com/admin`

### What You Can See:

#### 1. **Orders Table** with new "Vendor Verification" column:
- ✅ **Verified** - Vendor confirmed (shows timestamp)
- ⏰ **Awaiting Vendor** - Waiting for vendor (shows how long)
- **No Proof** - Customer hasn't uploaded screenshot yet

#### 2. **Monitor Vendor Performance**:
- See which vendors respond quickly
- Identify slow responders
- Track overdue verifications

#### 3. **Resolve Issues**:
- View payment screenshots
- See exact timestamps of all actions
- Help customers if vendor doesn't respond

---

## 🔄 **Complete Payment Timeline Example**

```
2:00 PM - Customer uploads payment screenshot
          ↓
2:00 PM - System records submission time
          ↓
2:01 PM - Vendor sees notification (Timer: 29m 59s)
          ↓
2:10 PM - Vendor views payment proof (Timer: 20m 00s)
          ↓
2:15 PM - Vendor confirms payment received
          ↓
2:15 PM - System updates:
          • Payment verified ✅
          • Order status: "Confirmed"
          • Customer notified
          ↓
2:16 PM - Production begins
```

---

## ❓ **Frequently Asked Questions**

### **For Customers:**

**Q: Why do I need to create an account?**
A: So you can track your order, see when payment is confirmed, and access your order history anytime!

**Q: What if the vendor doesn't confirm my payment?**
A: After 30 minutes, the admin team is automatically alerted and will help resolve it.

**Q: Can I see my order status?**
A: Yes! Just log into your dashboard at any time to see real-time updates.

**Q: Is my payment secure?**
A: Yes! You pay directly to the vendor's mobile money, and we track everything with timestamps for your protection.

---

### **For Vendors:**

**Q: What happens if I don't respond within 30 minutes?**
A: The order is flagged for admin review. Consistently slow responses may affect your vendor rating.

**Q: What if I receive a fake screenshot?**
A: Always check your actual mobile money account before confirming. If suspicious, contact admin.

**Q: Can I confirm multiple payments at once?**
A: Yes! Each order has its own "Confirm Payment" button in your dashboard.

**Q: What if I accidentally confirm the wrong payment?**
A: Contact admin immediately. They can help reverse and correct the issue.

---

### **For Admins:**

**Q: How do I know if a vendor is consistently slow?**
A: Check the "Vendor Verification" column - you'll see patterns of late confirmations.

**Q: What if there's a payment dispute?**
A: You have access to:
  - Payment screenshot
  - Submission timestamp
  - Verification timestamp (or lack thereof)
  - All order details

**Q: Can I manually verify a payment?**
A: Yes, admins can use the "Release Funds" button in the Settlement section.

---

## 🎨 **Visual Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     CUSTOMER JOURNEY                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Browse Products
                            ↓
                    Sign In/Register ← (Required!)
                            ↓
                    Select Size & Pay
                            ↓
                Upload Payment Screenshot
                            ↓
                  Redirected to Dashboard
                            ↓
        See Status: "Pending Vendor Confirmation"
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     VENDOR JOURNEY                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
            Notification: New Payment to Verify
                            ↓
            Login to Vendor Dashboard
                            ↓
            See Order with Timer (30:00)
                            ↓
            Click "View Proof" → See Screenshot
                            ↓
            Check Mobile Money Account
                            ↓
            Click "Confirm Payment"
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM UPDATES                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Customer sees: "Payment Verified ✅"
                            ↓
        Order status: "Confirmed → In Production"
                            ↓
        Admin sees: Green checkmark in dashboard
                            ↓
                    Everyone Happy! 🎉
```

---

## 📞 **Support**

### For Customers:
- Dashboard → Help & Support
- Live chat available
- Email: support@fla.com

### For Vendors:
- Vendor Dashboard → Help section
- WhatsApp: +233 50 511 2925
- Email: vendors@fla.com

### For Admins:
- Admin panel has all tools needed
- System logs available for troubleshooting

---

## ✅ **Benefits of This System**

### Security:
- ✅ All transactions tracked with timestamps
- ✅ Payment proof stored securely
- ✅ No lost orders

### Transparency:
- ✅ Customers see exact status
- ✅ Vendors have clear deadlines
- ✅ Admins have full oversight

### Efficiency:
- ✅ 30-minute response window keeps things moving
- ✅ Automated notifications
- ✅ Real-time updates

---

**Last Updated:** February 2026
**Version:** 1.0
