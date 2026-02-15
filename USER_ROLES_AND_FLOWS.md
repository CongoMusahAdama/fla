# FLA Purchase Ecosystem: User Roles & Procedural Flows

**Version 1.0**
**Date:** 2026-02-13
**Status:** Active

---

## 1. Introduction
FLA Purchase is a specialized marketplace where customers can buy high-quality fashion directly from independent artisans. This document outlines the distinct roles, responsibilities, and procedural workflows for the three key actors in the ecosystem: **The Vendor**, **The Customer**, and **The Admin**.

---

## 2. The Vendor (The Studio)
**Role Definition:** The creative engine of the platform. Vendors are independent fashion studios or artisans who design and sell their unique products.

### Key Responsibilities
*   **Product Development:** Designing and listing items for sale.
*   **Fulfillment:** Manufacturing high-quality goods once an order is placed.
*   **Order Management:** Tracking production timelines for individual orders.

### Procedural Flow

#### Phase 1: Onboarding & Setup
1.  **Registration**: New studios verify their phone number and submit business details (Name, Location, Payment Info).
2.  **Verification**: The account remains in a "Pending" state until approved by an Admin.
3.  **Store Configuration**: Once approved, the vendor sets up their storefront with a logo, bio, and operational hours.

#### Phase 2: Listing a Design
1.  **Drafting**: Vendor uploads a product image and description.
2.  **Configuration**:
    *   **Price**: The retail price for the item.
    *   **Tailoring Time**: The duration required to produce the item.
3.  **Launch**: The product goes live for immediate purchase.

#### Phase 3: The Production Cycle
1.  **Monitoring**: Vendor receives orders on their dashboard.
2.  **Order Event**:
    *   **Notification**: Vendor receives a "New Order" alert.
3.  **Manufacturing**: Vendor produces the item within the stated tailoring time.
4.  **Fulfillment**: Vendor ships the item to the FLA Logistics Hub or the customer.
5.  **Completion**: Vendor marks the order as "Shipped".

#### Phase 4: Financials
1.  **Earnings**: Revenue is calculated as `Active Orders * Price`.
2.  **Payout Request**: After delivery confirmation, funds move to "Available Balance".
3.  **Withdrawal**: Vendor requests a payout to their registered Mobile Money text.

---

## 3. The Customer (The Patron)
**Role Definition:** The patrons of the fashion economy. Customers buy unique, bespoke items directly from the makers.

### Key Responsibilities
*   **Selection**: Choosing unique designs from various studios.
*   **Verification**: Ensuring valid payment proofs are uploaded.
*   **Engagement**: Providing feedback and following production status.

### Procedural Flow

#### Phase 1: Discovery
1.  **Browsing**: Customer explores the marketplace.
2.  **Purchase**: Instead of waiting for a batch, they can pay and start their order immediately.
3.  **Transparency**: They view the vendor's tailoring time (e.g., *"3-5 business days"*).

#### Phase 2: Commitment (The Pledge)
1.  **Buy Now**: Customer selects size/options and proceeds to checkout.
2.  **Payment**:
    *   Transfer funds via Mobile Money to the FLA Central Wallet.
    *   Upload the **Proof of Payment** (Screenshot/Receipt) to the system.
3.  **Status**: Order enters **"Pending Verification"**.

#### Phase 3: The Waiting Room
1.  **Order Tracking**: Customer follows their order status updates.
2.  **Production Notification**: Status updates to **"Processing"** or **"In Production"**.
3.  **Delivery**: Customer receives the item once shipped.

---

## 4. The Admin (The HQ)
**Role Definition:** The central authority. The Admin ensures trust, verifying that money is safe and products are real.

### Key Responsibilities
*   **Gatekeeping:** Approving legitimate vendors and removing bad actors.
*   **Financial Clearing:** Verifying payments and releasing funds.
*   **Dispute Resolution:** Handling cancellations or quality issues.

### Procedural Flow

#### Phase 1: Security & Verification
1.  **Vendor Approval**: Reviewing new studio applications and activating their accounts.
2.  **Payment Verification**:
    *   Admin reviews "Pending" orders.
    *   Compares uploaded Proof of Payment against the actual bank statement.
    *   **Result**: Order status becomes "Confirmed".

#### Phase 2: Order Oversight
1.  **Monitoring**: Watching active orders for timely fulfillment.
2.  **Intervention**:
    *   **Dispute Handling**: Managing cancellations or issues.
    *   **Refunds**: Processing refunds if necessary.

#### Phase 3: Payouts
1.  **Withdrawal Requests**: operational Admin receives alerts when vendors request funds.
2.  **Processing**: Admin transfers funds from the Corporate Wallet to the Vendor.
3.  **Commission**: System automatically calculates and retains the platform fee.

---

## 5. System Interconnectivity

| Action | Vendor View | Customer View | Admin View |
| :--- | :--- | :--- | :--- |
| **New Listing** | "Active" | "Buy Now" | "New Product Logged" |
| **Customer Order** | "Pending Order" | "Pending Verification" | "Verify Payment Proof" |
| **Payment Confirmed** | "Order Confirmed" | "Paid - Preparing Order" | "Revenue Locked in Escrow" |
| **Production** | **"IN PRODUCTION"** | "Production Started" | "Monitor Cycle" |
| **Delivery** | "Order Completed" | "Order Delivered" | "Process Final Payout" |
