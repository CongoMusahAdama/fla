# Unity Purchase Ecosystem: User Roles & Procedural Flows

**Version 1.0**
**Date:** 2026-02-13
**Status:** Active

---

## 1. Introduction
Unity Purchase is a specialized group-buying marketplace where individual customers unlock wholesale pricing by pooling their orders. This document outlines the distinct roles, responsibilities, and procedural workflows for the three key actors in the ecosystem: **The Vendor**, **The Customer**, and **The Admin**.

---

## 2. The Vendor (The Studio)
**Role Definition:** The creative engine of the platform. Vendors are independent fashion studios or artisans who design products and set the "Unity" terms (batch sizes and wholesale prices).

### Key Responsibilities
*   **Product Architecture:** Designing items and defining the batch logic (e.g., "10 orders needed to start production").
*   **Fulfillment:** Manufacturing high-quality goods once a batch is confirmed.
*   **Inventory Management:** Tracking batch cycles and production timelines.

### Procedural Flow

#### Phase 1: Onboarding & Setup
1.  **Registration**: New studios verify their phone number and submit business details (Name, Location, Payment Info).
2.  **Verification**: The account remains in a "Pending" state until approved by an Admin.
3.  **Store Configuration**: Once approved, the vendor sets up their storefront with a logo, bio, and operational hours.

#### Phase 2: The Unity Listing (Batch Creation)
1.  **Drafting**: Vendor uploads a product image and description.
2.  **Configuration**:
    *   **Wholesale Price**: The discounted price per item (e.g., GHC 50).
    *   **Batch Size**: The number of orders required to trigger production (e.g., 20 items).
3.  **Launch**: The product goes live with a status of **"Gathering Orders"**.

#### Phase 3: The Production Cycle
1.  **Monitoring**: Vendor tracks the "Batch Meter" on their dashboard as customers join.
2.  **Trigger Event**:
    *   **Condition**: Batch Size is reached (e.g., 20/20 orders).
    *   **System Action**: Product status flips to **"In Production"**. Listing may be temporarily hidden or marked "Full".
    *   **Notification**: Vendor receives a "Start Production" alert.
3.  **Manufacturing**: Vendor produces the batch within the agreed timeline.
4.  **Fulfillment**: Vendor ships the bulk batch to the Unity Logistics Hub or individual customers (depending on logistics model).
5.  **Completion**: Vendor marks the batch as "Shipped".

#### Phase 4: Financials
1.  **Earnings**: Revenue is calculated as `Active Orders * Wholesale Price`.
2.  **Payout Request**: After delivery confirmation, funds move to "Available Balance".
3.  **Withdrawal**: Vendor requests a payout to their registered Mobile Money text.

---

## 3. The Customer (The Member)
**Role Definition:** The driving force of the economy. Customers are savvy shoppers who pledge to buy items to unlock wholesale rates.

### Key Responsibilities
*   **Participation**: Joining active batches to help reach production thresholds.
*   **Verification**: ensuring valid payment proofs are uploaded.
*   **Patience**: Understanding the "Wait-to-Save" model.

### Procedural Flow

#### Phase 1: Discovery
1.  **Browsing**: Customer explores the marketplace.
2.  **The Value Prop**: Instead of a "Buy Now" button, they see **"Join Batch"**.
3.  **Transparency**: They view the live progress bar (e.g., *"15/20 Joined - 5 more needed to start!"*).

#### Phase 2: Commitment (The Pledge)
1.  **Join Batch**: Customer selects size/options and commits to the order.
2.  **Payment**:
    *   Transfer funds via Mobile Money to the Unity Central Wallet.
    *   Upload the **Proof of Payment** (Screenshot/Receipt) to the system.
3.  **Status**: Order enters **"Pending Verification"**.

#### Phase 3: The Waiting Room
1.  **Batch Tracking**: Customer watches the progress bar fill up.
2.  **Production Notification**: Once the batch hits 100%, status updates to **"Production Started"**.
3.  **Delivery**: Customer receives the item after the production cycle is complete.

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
    *   **Action**: Clicks **"Confirm Payment"**.
    *   **Result**: Customer status becomes "Joined"; Vendor batch count increments.

#### Phase 2: Batch Oversight
1.  **Monitoring**: Watching active batches for stagnation (e.g., a batch stuck at 2/20 for months).
2.  **Intervention**:
    *   **Force Start**: Manually triggering production if a batch is close enough (e.g., 18/20).
    *   **Cancel Batch**: Refunding customers if a batch fails to fill.

#### Phase 3: Payouts
1.  **Withdrawal Requests**: operational Admin receives alerts when vendors request funds.
2.  **Processing**: Admin transfers funds from the Corporate Wallet to the Vendor.
3.  **Commission**: System automatically calculates and retains the platform fee.

---

## 5. System Interconnectivity

| Action | Vendor View | Customer View | Admin View |
| :--- | :--- | :--- | :--- |
| **New Listing** | "Active - 0/20 Joined" | "Join Batch (0/20)" | "New Product Logged" |
| **Customer Order** | "New Order (Pending)" | "Pending Verification" | "Verify Payment Proof" |
| **Payment Confirmed** | "Batch Count: 1/20" | "Joined! Waiting for Batch" | "Revenue Locked in Escrow" |
| **Batch Full** | **"START PRODUCTION"** | "Production Started" | "Release Material Funds" |
| **Delivery** | "Batch Completed" | "Order Delivered" | "Process Final Payout" |
