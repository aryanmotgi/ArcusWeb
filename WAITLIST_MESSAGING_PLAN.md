# Automated Welcome Messages for Arcus Waitlist

## Overview
Add automated email and SMS welcome messages to the Arcus waitlist signup system. Messages will be sent immediately after successful signup using Resend (email) and Twilio (SMS).

**Key Constraint:** No changes to frontend UI/UX - maintain current website look and feel.

## User Preferences
- **Email Service:** Resend (100 emails/day free tier)
- **SMS Service:** Twilio (~$0.0079/SMS)
- **Send Timing:** Immediately after successful signup
- **Message Style:** Same unified message for both channels

## Architecture Decisions

### Integration Approach
**Integrate messaging logic directly into existing edge function** at:
- `/Users/aryanmotgi/Downloads/ArcusWeb-main/src/supabase/functions/server/index.tsx`

**Rationale:**
- Maintains transaction atomicity (database insert + messaging in one request)
- No additional network hops or cold starts
- Simpler to maintain and debug
- Follows existing synchronous pattern

### Execution Flow
```
1. Validate user input (email/phone)
2. Insert into Supabase waitlist table
3. If insert succeeds:
   - Attempt to send email (if email provided)
   - Attempt to send SMS (if phone provided)
   - Log any messaging failures
   - Return success to user regardless of messaging status
4. If insert fails, return error (existing behavior)
```

### Error Handling Strategy
**Fail silently** - don't block signup or notify user of messaging failures.

**Rationale:**
- Primary goal is capturing contact info, not message delivery
- User already sees success modal
- Admin monitoring via logs is sufficient
- Prevents poor UX from third-party API failures

## Implementation Details

### 1. Resend Email Integration

**Setup:**
1. Create account at https://resend.com
2. Generate API key from dashboard
3. Verify sender domain (or use `onboarding@resend.dev` for testing)
4. Add environment variable: `RESEND_API_KEY=re_xxx`

**Email Content:**
- **Subject:** "Welcome to Arcus - Your spot is secured"
- **Design:** Minimalist black background, white text, Arcus branding
- **Message:** "You're on the list. Thank you for joining the Arcus waitlist. We'll notify you when the collection drops. Built for the disciplined. Designed for those who lead quietly."
- **Format:** HTML template with plain text fallback
- **Footer:** Instagram and TikTok social links

**Implementation:**
```typescript
// Add import at top of index.tsx
import { Resend } from 'npm:resend@4.0.1';

// Add helper function
async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured - skipping email');
      return;
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: 'Arcus <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to Arcus - Your spot is secured',
      html: `[HTML template]`,
      text: `[Plain text fallback]`
    });

    console.log(`Welcome email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    // Fail silently - don't throw
  }
}
```

### 2. Twilio SMS Integration

**Setup:**
1. Create account at https://www.twilio.com
2. Get phone number from console (~$1/month)
3. Generate API credentials (Account SID + Auth Token)
4. Add environment variables:
   - `TWILIO_ACCOUNT_SID=ACxxx`
   - `TWILIO_AUTH_TOKEN=xxx`
   - `TWILIO_PHONE_NUMBER=+1xxx`

**SMS Content (157 characters - under 160 limit):**
```
Welcome to Arcus. You're on the waitlist. We'll notify you when the collection drops.

Built for the disciplined.

- Arcus Team
```

**Implementation:**
```typescript
// Add helper function
async function sendWelcomeSMS(phone: string): Promise<void> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') ?? '';

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured - skipping SMS');
      return;
    }

    // Normalize phone number
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

    console.log(`Welcome SMS sent successfully to: ${formattedPhone}`);
  } catch (error) {
    console.error(`Failed to send welcome SMS to ${phone}:`, error);
    // Fail silently - don't throw
  }
}
```

### 3. Modify POST Endpoint

Update the POST `/make-server-13c7a257/waitlist` endpoint in `index.tsx`:

**After successful database insert (line 64), add:**
```typescript
console.log(`Contact saved to waitlist table - email: ${email || 'null'}, phone: ${phone || 'null'}`);

// NEW: Send welcome messages (fire and forget)
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

## Environment Variables

Add to Supabase Dashboard (Project Settings > Edge Functions > Environment Variables):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

## Edge Cases Handled

### Both Email and Phone Provided
- Send both email and SMS
- Both execute in parallel (fire-and-forget)
- User receives confirmation on both channels

### API Service Downtime
- User signup succeeds (database insert worked)
- Message not sent
- Error logged for admin review
- Other channel still sent (e.g., SMS sent even if email fails)

### Duplicate User
- Database returns error code 23505 before messaging logic runs
- No duplicate messages sent
- User sees existing error message

### Invalid Contact Info
- Frontend validation catches most cases
- Third-party APIs (Resend/Twilio) validate format
- If invalid, error logged but signup still succeeds
- Fail silently to user

### Missing Environment Variables
- Check for missing config at function start
- Log clear error message
- Skip API call
- User signup still succeeds

### International Phone Numbers
- Assumes US (+1) if no country code
- If user provides +44, country code preserved
- Non-US without country code will fail silently

## Files to Modify

**Primary file:**
- `/Users/aryanmotgi/Downloads/ArcusWeb-main/src/supabase/functions/server/index.tsx`
  - Add Resend import
  - Add `sendWelcomeEmail()` helper function
  - Add `sendWelcomeSMS()` helper function
  - Modify POST `/waitlist` endpoint to call messaging functions after successful insert

**No frontend changes required** - maintains current UI/UX

## Testing Checklist

**Functional Tests:**
- [ ] Email-only signup sends email
- [ ] Phone-only signup sends SMS
- [ ] Both email and phone sends both messages
- [ ] Duplicate signup shows error, no messages sent
- [ ] Invalid email logs error, signup succeeds
- [ ] Invalid phone logs error, signup succeeds

**Error Handling:**
- [ ] Missing RESEND_API_KEY logs error, no email sent
- [ ] Missing Twilio credentials logs error, no SMS sent
- [ ] API timeout logs error, signup succeeds

**Content Verification:**
- [ ] Email HTML renders correctly (test in Gmail, Outlook, Apple Mail)
- [ ] Email plain text renders correctly
- [ ] SMS character count under 160
- [ ] All links in email work
- [ ] Brand voice matches Arcus identity

**Performance:**
- [ ] Signup response time < 2s
- [ ] Messages sent within 5s of signup

## Deployment Steps

1. **Create service accounts:**
   - Sign up for Resend
   - Sign up for Twilio
   - Obtain API credentials

2. **Configure environment:**
   - Add environment variables to Supabase dashboard
   - Verify domain for Resend (or use onboarding@resend.dev)

3. **Implement code:**
   - Add Resend import
   - Add helper functions
   - Modify POST endpoint

4. **Test locally (optional):**
   ```bash
   supabase functions serve server --env-file .env.local
   ```

5. **Deploy to production:**
   ```bash
   supabase functions deploy server
   ```

6. **Monitor:**
   ```bash
   supabase functions logs server --tail
   ```

7. **Verify:**
   - Test signup on production
   - Verify messages received
   - Check logs for errors
   - Monitor Resend/Twilio dashboards

## Cost Analysis

### Projected Monthly Costs

**Low Volume (50 signups/day):**
- Resend: $0 (free tier - 3,000/month)
- Twilio: $13/month ($0.40/day × 30 + $1 phone rental)
- **Total: $13/month**

**High Volume (500 signups/day):**
- Resend: $20/month (paid tier - 50,000 emails)
- Twilio: $79/month ($2.60/day × 30 + $1 phone rental)
- **Total: $99/month**

## Monitoring

**Daily checks:**
- Review Supabase function logs for errors
- Check Resend dashboard for delivery rates
- Check Twilio console for SMS delivery
- Monitor costs

**Alert thresholds:**
- Email success rate < 90%
- SMS success rate < 90%
- 5+ failures within 1 hour

**Dashboards:**
- Supabase Logs: https://supabase.com/dashboard/project/rfykfxzdormkgelxzkyc/logs
- Resend: https://resend.com/emails
- Twilio: https://console.twilio.com/us1/monitor/logs/sms

## Rollback Plan

If issues arise:

1. Redeploy previous version of edge function
2. User signups continue working (messaging disabled)
3. No frontend changes to revert

```bash
git revert <commit-hash>
supabase functions deploy server
```

## Success Criteria

- [ ] User can sign up with email and receive welcome email
- [ ] User can sign up with phone and receive welcome SMS
- [ ] User can sign up with both and receive both messages
- [ ] Signup succeeds even if messaging fails
- [ ] No changes to website appearance or user flow
- [ ] All errors logged for admin review
- [ ] Messages align with Arcus brand identity
