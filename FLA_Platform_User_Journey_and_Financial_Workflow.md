# FLA Platform Ecosystem: User Journey & Financial Workflow
**A Comprehensive Guide for the Customer, Vendor, and Admin Interconnectivity**

---

## 1. Introduction
FLA (Fashion Logistics Application) is a sophisticated three-sided marketplace where bespoke tailoring meets real-time logistics. The ecosystem is built on a foundation of trust, managed through a central **Admin HQ** that handles the financial "Escrow" system to protect both customers and vendors.

---

## 2. Core Dashboard Journeys

### I. The Customer Journey (The Muse)
The Customer journey is designed for seamless style curation and secure transactions.
1.  **Discovery**: Customers browse the shop, filter by categories (Cape, Hoodie, etc.), or request bespoke tailoring.
2.  **Order Placement**: Once a design is selected, the customer chooses their "Silhouette" (Size) and customization details.
3.  **The Payment Event (MoMo Flow)**: 
    *   FLA uses a **Proof-of-Payment** model. 
    *   The customer pays via Mobile Money to the platform's central wallet.
    *   They upload a **screenshot or receipt proof** directly into the ordering portal.
4.  **Tracking**: After payment, the customer monitors their status through their personal dashboard (Pending -> Confirmed -> Processing -> Delivered).

### II. The Vendor Journey (The Studio)
Vendors are the artisans of the platform. Their journey focus on craft and fulfillment.
1.  **Onboarding**: Professional studios register and create their brand profile.
2.  **Collection Management**: Vendors list products, set tailoring times, and manage stock levels.
3.  **Order Notification**: When a customer orders, the vendor sees it in their "Studio Panel" as **Pending**.
4.  **Production Logic**: The vendor **does not start production** until the Admin verifies the funds. Once the status changes to "Confirmed," the artisan begins the tailoring process.
5.  **Revenue & Withdrawal**: Vendors track their earnings in their "Wallet snapshot." After delivery, they can request payouts to their own MoMo accounts.

### III. The Admin Journey (The HQ)
The Admin is the "Super User" who moderates the platform and controls the flow of money.
1.  **Global Oversight**: The Admin HQ monitors platform-wide stats: Total Revenue, Escrow Balance, and Active User base.
2.  **Security Moderation**: Approving or suspending vendors to ensure high-quality listings.
3.  **The Master Key**: Accessing the "Escrow & Payments" department to handle platform-wide financial disputes.

---

## 3. The Financial Master-Flow (Crucial for Clients)
The relationship between the three dashboards is most critical during the payment phase. Here is how the "Super Power" Admin control works:

### Step 1: Secure Escrow (Customer -> Admin)
When a customer pays, the money enters the **Platform Escrow**. It belongs to neither the vendor nor the admin yet—it is "Held for Production." 
*   **Customer View**: "Waiting for verification."
*   **Vendor View**: "Order received (Payment Pending)."

### Step 2: The Verification Power (Admin Hub)
The Admin visits the **Escrow & Payments** section. They see the customer's uploaded receipt proof.
*   **The Action**: The Admin cross-references the receipt with the actual bank/MoMo balance.
*   **The "Super Power"**: The Admin clicks **"Confirm & Release"**.
*   **The Result**: The backend simultaneously triggers three events:
    1.  Notifies the Customer that their order is official.
    2.  Signals the Vendor to begin the tailoring/printing process (Production Start).
    3.  Moves the funds from "Escrow" to the Vendor's "Pending Balance."

### Step 3: Production & Delivery
The Vendor fulfills the order. Status updates in real-time across all three panels.

### Step 4: Final Payout (Admin -> Vendor)
Once the order is completed and delivered:
1.  The Vendor requests a **Withdrawal**.
2.  The Admin approves the transfer from the platform's central wallet to the Vendor's individual MoMo account.
3.  A small platform commission (e.g., 5%) is deducted to cover FLA operations.

---

## 4. Summary Table of Relationships

| Feature | Customer Dashboard | Vendor Dashboard | Admin Dashboard |
| :--- | :--- | :--- | :--- |
| **Visibility** | Own Orders | Own Collections & Sales | Global Statistics |
| **Payment Role** | Pay & Upload Proof | View Earned Revenue | **Verify & Release Funds** |
| **Product Role** | Browse & Purchase | Create & List Products | Moderate & Delete Listings |
| **Security** | Track Shipment | Request Withdrawal | **Freeze/Suspend Accounts** |

---
**Document prepared for:** FLA Client Project
**Subject:** System Architecture & Financial Logic Presentation
