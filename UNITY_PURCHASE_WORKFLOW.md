let change any workd FLA TO un# UNITY PURCHASE (Formerly FLA) - Workflow & Logic

## 1. Core Concept: "The Unity Efficiency"
The platform pivots from a standard marketplace to a **Group Buying / Wholesale-Scaling Platform**. 
- **Goal**: Unlock wholesale prices for individual customers by grouping their orders.
- **Mechanism**: Vendors sew in batches. Production only starts when a specific "Batch Threshold" is met.

---

## 2. The Logic Flow

### A. Vendor Side (The Architect)
1. **Setting the Terms**:
   - Vendor uploads a Shirt Design.
   - **Crucial Inputs**:
     - `Single Price` (High, e.g., GHC 70).
     - `Wholesale Price` (Target, e.g., GHC 50).
     - `Batch Size` (e.g., 10 pieces).
   - *Result*: The platform calculates the target revenue to start work (10 * 50 = GHC 500).

2. **The Waiting Game**:
   - Vendor listing goes live.
   - Status: **"Gathering Orders"**.
   - Vendor waits. No work happens yet.

3. **The Green Light**:
   - Notification: "Batch Full (10/10)".
   - **Visibility Shutdown**: The product is automatically **HIDDEN** or marked **"Sold Out / In Production"** on the customer side. No new orders can be placed for this batch.
   - **Funds**: The pool (e.g., GHC 500) is flagged for release (or partial release) to fund materials.
   - **Action**: Vendor starts sewing.

4. **Completion**:
   - Vendor finishes all 10 items.
   - Vendor ships to Hub.
   - Hub confirms delivery.
   - **Cycle Reset**: The product becomes **VISIBLE** again for the next batch of 10.

### B. Customer Side (The Contributor)
1. **Discovery**:
   - Customer sees a shirt.
   - **Price**: Displayed as the **Wholesale Price** (e.g., GHC 50).
   - **Transparency**: A prominent counter shows status:
     - *"2 more people left for work to start!"*
     - *"8/10 Joined"*

2. **The Purchase (The Pledge)**:
   - Customer pays the wholesale price.
   - Money goes to **Escrow**.
   - **Expectation Management**: Customer understands: "My shirt isn't being sewn *today*. It gets sewn when 2 more people join."

3. **Completion**:
   - Once the counter hits 10/10:
     - Status updates: "Production Started".
     - Customer awaits delivery.

---

## 3. Financial Workflow

1.  **Ingest**: Customers A, B, C... pay GHC 50 each -> **Escrow Wallet**.
2.  **Hold**: Funds stay in Escrow until `OrderCount == BatchSize`.
3.  **Trigger**: 
    - When `OrderCount == 10`:
      - **Escrow** status for these 10 orders moves to **"Allocated for Production"**.
      - Admin releases funds (full or partial) to Vendor to buy fabric.
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
