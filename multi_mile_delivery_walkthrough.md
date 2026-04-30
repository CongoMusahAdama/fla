# Multi-Mile Delivery System Walkthrough

This document provides a comprehensive overview of the **Multi-Mile Delivery** system on the FLA platform. This system handles the specific logistics of Ghana's trade regions, distinguishing between local (intra-regional) and long-distance (inter-regional) deliveries.

---

## 🌍 The Concept: Intra vs. Inter Regional

The platform distinguishes between two types of delivery logic:

1.  **Intra-Regional (Last-Mile):** Vendor and Customer are in the same region (e.g., both in Accra). Delivery is handled directly.
2.  **Inter-Regional (Multi-Mile):** Vendor and Customer are in different regions (e.g., Vendor in Accra, Customer in Tamale). This requires a two-step delivery:
    *   **First Mile:** Vendor sends the item to a transport station.
    *   **Second Mile:** The transport station delivers the item to the buyer's region.

---

## 📦 1. Vendor Workflow: Setting the Fee

For **Inter-Regional** orders, vendors manage the "First-Mile" costs through their dashboard.

### Key Features for Vendors:
*   **Set Delivery Fee:** Vendors can enter the specific cost required to get the item to the transport station.
*   **Automated Verification:** Once a customer pays, the system automatically marks the fee as PAID. Vendors no longer need to manually verify screenshots.
*   **Shipping Control:** The "Mark Shipped" action is only enabled once both the order payment and the delivery fee have been successfully processed via Hubtel.

---

## 🛍️ 2. Customer Workflow: Secure Payments

Customers pay transport costs directly on the platform using Hubtel, ensuring speed and security.

### Key Features for Customers:
*   **Itemized Delivery Costs:** Delivery fees are listed separately from the product price for full transparency.
*   **Instant Hubtel Checkout:** Customers click **"Pay Delivery Fee"** to pay via MoMo, Card, or Bank Transfer. No screenshots required!
*   **Real-time Notifications:**
    *   **SMS/Email Alert:** Received when a vendor sets the delivery fee.
    *   **Instant Confirmation:** Received immediately after a successful Hubtel transaction.

---

## 🛡️ 3. Admin Workflow: Platform Oversight

Administrators have a high-level view of all delivery transactions to ensure fairness.

### Key Features for Admins:
*   **Automated Tracking:** The Admin HQ tracks the **First Mile Payment ID** from Hubtel for every delivery fee.
*   **Financial Accuracy:** Delivery fees are handled as direct pass-throughs, ensuring platform commissions are only calculated on product prices.

---

## 🛠️ Technical Implementation Summary

| Component | Changes Implemented |
| :--- | :--- |
| **Database** | Added `deliveryType`, `firstMileFee`, `isFirstMileFeePaid`, and `firstMilePaymentId` to the `Order` schema. |
| **Backend API** | Integrated Hubtel webhooks to automatically verify delivery fee payments via `paymentType: 'first_mile_fee'` metadata. |
| **Vendor UI** | Logic to prevent "Mark Shipped" until delivery fees are cleared via the gateway. |
| **Customer UI** | Redirect flow to Hubtel for delivery fee payments, replacing the old manual upload system. |
| **Notifications** | Automated SMS and Email triggers via `SmsService` and `EmailService` (Resend). |

---

> [!TIP]
> This automated system eliminates the friction of manual verification, allowing vendors to ship faster and giving customers immediate peace of mind that their logistics costs are securely handled.
