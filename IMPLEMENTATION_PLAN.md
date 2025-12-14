# Full Implementation Plan: Automated Welcome Messages

## Test Results Summary

### ✅ Resend API Test - PASSED
- **Test Date:** December 12, 2025
- **API Key:** Configured and working
- **Test Email Sent To:** realarcus1@gmail.com
- **Response ID:** dc1b654c-9833-4828-aa48-49bdb88dba8c
- **Status:** Email successfully sent

### ⚠️ Current Limitation
Resend account is in **testing mode**:
- Can only send to: `realarcus1@gmail.com`
- To send to all waitlist users, you must verify a domain

---

## Pre-Implementation Checklist

### 1. Resend Domain Verification (CRITICAL)
**Status:** ⏳ Required before production use

**Steps:**
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `arcuswear.com`)
4. Resend will provide DNS records to add:
   - **SPF Record:** TXT record
   - **DKIM Record:** TXT record
   - **DMARC Record:** TXT record (optional but recommended)
5. Add these DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
6. Wait 5-10 minutes for DNS propagation
7. Click "Verify" in Resend dashboard
8. Once verified, you can send from emails like:
   - `team@arcuswear.com`
   - `hello@arcuswear.com`
   - `waitlist@arcuswear.com`

**Alternative for Testing:**
- Continue using `onboarding@resend.dev` but emails will only go to `realarcus1@gmail.com`
- Good for development/testing
- NOT suitable for production

---

### 2. Twilio Setup (For SMS)
**Status:** ⏳ Not started

**Steps:**
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Complete phone verification
4. Get a Twilio phone number:
   - Go to Phone Numbers > Manage > Buy a Number
   - Select a US number (~$1/month)
   - Click "Buy"
5. Get your credentials:
   - Go to Console Dashboard
   - Copy **Account SID** (starts with `AC`)
   - Copy **Auth Token** (click to reveal)
6. Add to `.env` file:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```

**Cost:** ~$13/month for 50 signups/day
- $1/month phone rental
- $0.0079 per SMS × ~50/day = ~$12/month

---

## Implementation Steps

### Phase 1: Prepare Environment Variables for Edge Function

Supabase Edge Functions need environment variables configured in the Supabase dashboard, NOT from the `.env` file.

**Steps:**
1. Go to https://supabase.com/dashboard/project/rfykfxzdormkgelxzkyc
2. Navigate to: **Edge Functions** → **Environment Variables**
3. Add the following variables:
   - `RESEND_API_KEY` = `re_VWBedvCb_DgmeEfWfZ5gBna71EegaWpA6`
   - `TWILIO_ACCOUNT_SID` = (your Twilio SID)
   - `TWILIO_AUTH_TOKEN` = (your Twilio token)
   - `TWILIO_PHONE_NUMBER` = (your Twilio number, e.g., +15551234567)
   - `SUPABASE_URL` = `https://rfykfxzdormkgelxzkyc.supabase.co` (already set)
   - `SUPABASE_SERVICE_ROLE_KEY` = (already set)

**Why?** Edge functions run on Supabase's infrastructure, not locally. They need variables configured in their platform.

---

### Phase 2: Implement Email Function

**File:** `/Users/aryanmotgi/Downloads/ArcusWeb-main/src/supabase/functions/server/index.tsx`

**Location:** Add after imports (around line 5)

**Code to Add:**
```typescript
// Import Resend
import { Resend } from 'npm:resend@4.0.1';

// Email sending function
async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey || apiKey === '') {
      console.error('RESEND_API_KEY not configured - skipping email send');
      return;
    }

    const resend = new Resend(apiKey);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #F5F5F0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0 30px 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 400; letter-spacing: 2px; color: #F5F5F0;">ARCUS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 400; color: #F5F5F0;">You're on the list.</h2>
              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #F5F5F0CC;">Thank you for joining the Arcus waitlist. We'll notify you when the collection drops.</p>
              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #F5F5F0CC;">Built for the disciplined. Designed for those who lead quietly.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 30px 20px; border-top: 1px solid #333333;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #F5F5F099;">Follow us</p>
              <a href="https://www.instagram.com/arcuswear/" style="color: #F5F5F0CC; text-decoration: none; margin: 0 10px;">Instagram</a>
              <span style="color: #666666;">|</span>
              <a href="https://www.tiktok.com/@arcuswear" style="color: #F5F5F0CC; text-decoration: none; margin: 0 10px;">TikTok</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const plainText = `
ARCUS

You're on the list.

Thank you for joining the Arcus waitlist. We'll notify you when the collection drops.

Built for the disciplined. Designed for those who lead quietly.

---
Follow us:
Instagram: https://www.instagram.com/arcuswear/
TikTok: https://www.tiktok.com/@arcuswear
    `;

    await resend.emails.send({
      from: 'Arcus <onboarding@resend.dev>', // Change to your domain after verification
      to: email,
      subject: 'Welcome to Arcus - Your spot is secured',
      html: htmlContent,
      text: plainText,
    });

    console.log(`✅ Welcome email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    // Fail silently - don't throw error
  }
}
```

---

### Phase 3: Implement SMS Function

**File:** `/Users/aryanmotgi/Downloads/ArcusWeb-main/src/supabase/functions/server/index.tsx`

**Location:** Add after the email function

**Code to Add:**
```typescript
// SMS sending function
async function sendWelcomeSMS(phone: string): Promise<void> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') ?? '';

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured - skipping SMS send');
      return;
    }

    // Normalize phone number (assume US if no country code)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+1${cleanPhone}`;

    // Call Twilio API using Basic Auth
    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedPhone,
          Body: `Welcome to Arcus. You're on the waitlist. We'll notify you when the collection drops.\n\nBuilt for the disciplined.\n\n- Arcus Team`
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
    }

    console.log(`✅ Welcome SMS sent successfully to: ${formattedPhone}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome SMS to ${phone}:`, error);
    // Fail silently - don't throw error
  }
}
```

---

### Phase 4: Modify POST Endpoint

**File:** `/Users/aryanmotgi/Downloads/ArcusWeb-main/src/supabase/functions/server/index.tsx`

**Location:** Inside the POST `/make-server-13c7a257/waitlist` endpoint

**Find this code (around line 64):**
```typescript
console.log(`Contact saved to waitlist table - email: ${email || 'null'}, phone: ${phone || 'null'}`);

return c.json({ success: true, message: "Contact saved successfully" });
```

**Replace with:**
```typescript
console.log(`Contact saved to waitlist table - email: ${email || 'null'}, phone: ${phone || 'null'}`);

// Send welcome messages (fire and forget)
if (email && email.trim() !== '') {
  sendWelcomeEmail(email).catch(err =>
    console.error('Background email send failed:', err)
  );
}

if (phone && phone.trim() !== '') {
  sendWelcomeSMS(phone).catch(err =>
    console.error('Background SMS send failed:', err)
  );
}

return c.json({ success: true, message: "Contact saved successfully" });
```

---

### Phase 5: Deploy to Supabase

**Option A: Deploy via Supabase Dashboard (Easiest)**
1. Go to https://supabase.com/dashboard/project/rfykfxzdormkgelxzkyc/functions
2. Find the `server` function
3. Click "Deploy" or "Update"
4. Copy/paste the entire updated `index.tsx` file
5. Click "Deploy"

**Option B: Deploy via Supabase CLI**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref rfykfxzdormkgelxzkyc

# Deploy the function
supabase functions deploy server
```

---

### Phase 6: Testing

**Test 1: Email-Only Signup**
```bash
curl -X POST "https://rfykfxzdormkgelxzkyc.supabase.co/functions/v1/make-server-13c7a257/waitlist" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeWtmeHpkb3Jta2dlbHh6a3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTc0MjgsImV4cCI6MjA4MDM3MzQyOH0.jWM4589UPyplk3Hvzpo1RKyoqtEBaieBWwEizOz3-0Y" \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@test.com","phone":""}'
```
Expected: Email sent to test123@test.com (if domain verified)

**Test 2: Phone-Only Signup**
```bash
curl -X POST "https://rfykfxzdormkgelxzkyc.supabase.co/functions/v1/make-server-13c7a257/waitlist" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeWtmeHpkb3Jta2dlbHh6a3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTc0MjgsImV4cCI6MjA4MDM3MzQyOH0.jWM4589UPyplk3Hvzpo1RKyoqtEBaieBWwEizOz3-0Y" \
  -H "Content-Type: application/json" \
  -d '{"email":"","phone":"5551234567"}'
```
Expected: SMS sent to +15551234567 (if Twilio configured)

**Test 3: Both Email and Phone**
```bash
curl -X POST "https://rfykfxzdormkgelxzkyc.supabase.co/functions/v1/make-server-13c7a257/waitlist" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeWtmeHpkb3Jta2dlbHh6a3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTc0MjgsImV4cCI6MjA4MDM3MzQyOH0.jWM4589UPyplk3Hvzpo1RKyoqtEBaieBWwEizOz3-0Y" \
  -H "Content-Type: application/json" \
  -d '{"email":"test456@test.com","phone":"5559876543"}'
```
Expected: Both email and SMS sent

**Test 4: Check Supabase Logs**
```bash
# View logs for debugging
# Go to: https://supabase.com/dashboard/project/rfykfxzdormkgelxzkyc/logs/edge-functions
# Filter by function: server
# Look for ✅ and ❌ emoji indicators
```

---

## Monitoring After Deployment

### Daily Checks
1. **Supabase Logs:** Check for errors in edge function logs
2. **Resend Dashboard:** https://resend.com/emails - view delivery rates
3. **Twilio Console:** https://console.twilio.com/us1/monitor/logs/sms - view SMS delivery

### Success Metrics
- Email delivery rate > 90%
- SMS delivery rate > 90%
- No "RESEND_API_KEY not configured" errors
- No "Twilio credentials not configured" errors

---

## Rollback Plan

If something goes wrong:

1. **Revert Edge Function:**
   - Go to Supabase Dashboard → Edge Functions → server
   - Click "Deployments" tab
   - Find previous working version
   - Click "Redeploy"

2. **Verify:**
   - Test signup still works
   - Check logs for errors
   - No messages sent (messaging disabled)

---

## Cost Summary

### Current Setup
- **Resend:** $0/month (free tier - 3,000 emails/month)
- **Twilio:** ~$13/month (50 SMS/day + phone rental)
- **Total:** ~$13/month

### High Volume (500 signups/day)
- **Resend:** $20/month (paid tier)
- **Twilio:** ~$79/month
- **Total:** ~$99/month

---

## Current Status

### ✅ Completed
- [x] Supabase connection verified
- [x] `.env` file created with credentials
- [x] `.gitignore` created to protect secrets
- [x] Resend API tested successfully
- [x] Implementation plan created

### ⏳ Next Steps (In Order)
1. [ ] Verify domain in Resend (or decide to use testing mode)
2. [ ] Set up Twilio account and get credentials
3. [ ] Add environment variables to Supabase dashboard
4. [ ] Implement email function in edge function
5. [ ] Implement SMS function in edge function
6. [ ] Modify POST endpoint to call messaging functions
7. [ ] Deploy updated edge function to Supabase
8. [ ] Test with real signups
9. [ ] Monitor logs and delivery rates

---

## Important Notes

1. **Domain Verification is Critical:**
   - Without it, emails only go to `realarcus1@gmail.com`
   - Takes 5-10 minutes after adding DNS records
   - Required for production use

2. **Environment Variables:**
   - Local `.env` file is for reference only
   - Edge functions use Supabase dashboard variables
   - Must be configured in both places

3. **Error Handling:**
   - Messaging failures don't block signups
   - All errors logged for debugging
   - Users always see success if database insert works

4. **Testing Strategy:**
   - Test email first (easier to verify)
   - Then test SMS (costs money per message)
   - Use Supabase logs to debug issues

---

## Support Resources

- **Resend Docs:** https://resend.com/docs
- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Implementation Guide:** See WAITLIST_MESSAGING_PLAN.md for detailed architecture
