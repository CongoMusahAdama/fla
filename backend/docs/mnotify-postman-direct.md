# Test mNotify directly in Postman (what support expects)

FLA's `/api/auth/resend-otp` only needs `{ "phone": "0203154307" }`.
The **backend** adds `sender` and `message` when calling mNotify.

To test **mNotify itself** (same as support), use:

**POST** `https://api.mnotify.com/api/sms/quick?key=YOUR_MNOTIFY_API_KEY`

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "recipient": ["0203154307"],
  "sender": "FLAMINGO",
  "message": "FLA Purchase: your studio verification code is 1234. Valid for 10 minutes.",
  "is_schedule": false
}
```

- `sender` must be an **approved** Sender ID in your mNotify dashboard (max 11 chars).
- `recipient` uses Ghana format `0XXXXXXXXX`.
- Do **not** add `sms_type: "otp"` unless mNotify enables OTP route on your account.

**Success example:** `"status": "success"`, `"code": "2000"`

**Common errors:**
- `402` — insufficient SMS balance (top up Wallet → SMS credits)
- `419` — account flagged on OTP route
