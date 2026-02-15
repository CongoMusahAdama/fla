# FLA PURCHASE - Workflow & Logic

## 1. Core Concept: "The FLA Marketplace"
The platform is a specialized marketplace for independent fashion studios and artisans to sell their designs directly to customers.
- **Goal**: Provide a platform for unique, high-quality bespoke and ready-to-wear fashion.
- **Mechanism**: Immediate purchase with production timelines clearly communicated by vendors.

---

## 2. The Logic Flow

### A. Vendor Side (The Architect)
1. **Setting the Terms**:
   - Vendor uploads a Shirt Design.
   - **Crucial Inputs**:
     - `Price` (The standard retail price).
     - `Tailoring Time` (How long it takes to sew after an order).
   - *Result*: The product is live for individual purchase.

2. **The Order**:
   - Notification: "New Order Received".
   - Vendor prepares materials and starts sewing based on the communicated tailoring time.

3. **Shipment**:
   - Vendor ships to Hub once complete.
   - Hub confirms delivery.

### B. Customer Side (The Patron)
1. **Discovery**:
   - Customer sees a shirt.
   - **Price**: Standard retail price.
   - **Tailoring Time**: Information on when the shirt will be ready.

2. **The Purchase**:
   - Customer pays the displayed price.
   - Money goes to **Escrow**.

3. **Completion**:
   - Customer awaits delivery based on vendor's timeline.

---

## 3. Financial Workflow

1.  **Ingest**: Customer pays -> **Escrow Wallet**.
2.  **Verify**: Admin verifies payment.
3.  **Trigger**: 
    - Vendor releases order for production.
4.  **Payout**:
    - Final settlement after delivery confirmation.

---

## 4. Technical Implementation Plan

### A. Database Modifications (Schema)

**1. Product Schema**
- `targetBatchSize`: Number (e.g., 10)
- `currentBatchCount`: Number (Current orders in this cycle)
- `wholesalePrice`: Number (The display price)
- `batchStatus`: String (Enum: `'GATHERING'`, `'PRODUCTION'`, `'COMPLETED'`)
- `isVisible`: Boolean (Toggles off when `batchStatus` is `'PRODUCTION'`)

**2. Order Schema**
- `batchId`: String (Link to specific production cycle - optional but good for history)
- `productionStatus`: String (Tracks if this specific order is in the 'Gathering' or 'Sewing' phase)

### B. Frontend Changes
- **Vendor Dashboard**: 
  - Add inputs for `Batch Size` and `Wholesale Price`.
  - Show "Active Batches" progress.
- **Customer View**:
  - Replace standard "Buy" with **"Join Batch"**.
  - Add **Progress Bar** / Counter: `[======....] 6/10`.
  - Add Explainer Tooltip: "Why wait? You get wholesale pricing!"

---
