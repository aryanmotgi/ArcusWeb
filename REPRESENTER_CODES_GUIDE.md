# One-Time Representer Codes Guide

## Overview
You now have TWO ways for representers to access the page:
1. **Master Code**: `arcus2025` - Never expires, use for yourself
2. **One-Time Codes**: Custom codes that can only be used once

## Step-by-Step: How to Create & Send Codes

### Step 1: Create the Database Table (ONE-TIME SETUP)

1. Go to your Supabase dashboard: https://rfykfxzdormkgelxzkyc.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Create the table for one-time codes
CREATE TABLE representer_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  used_by_email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE representer_codes ENABLE ROW LEVEL SECURITY;

-- Allow public to read codes (needed for validation)
CREATE POLICY "Allow public to read codes"
  ON representer_codes
  FOR SELECT
  TO public
  USING (true);

-- Allow public to update codes (needed to mark as used)
CREATE POLICY "Allow public to update codes"
  ON representer_codes
  FOR UPDATE
  TO public
  USING (true);
```

5. Click **Run** button
6. You should see "Success. No rows returned"

### Step 2: Generate Access Codes

You can generate codes in two ways:

#### Option A: Using Online Generator (Easiest)
1. Go to: https://www.random.org/strings/
2. Set these options:
   - Number of random strings: 10 (or however many you need)
   - Length: 12-16 characters
   - Characters: Alphanumeric (a-z, A-Z, 0-9)
3. Click **Get Strings**
4. Copy the codes

#### Option B: Using Supabase (Recommended)
1. Go to **SQL Editor** in Supabase
2. Run this query to generate 10 codes:

```sql
-- Generate 10 random codes
INSERT INTO representer_codes (code, notes)
SELECT
  'ARCUS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  'Batch created on ' || NOW()::DATE
FROM generate_series(1, 10);

-- View the codes you just created
SELECT code, created_at FROM representer_codes WHERE used = false ORDER BY created_at DESC LIMIT 10;
```

This creates codes like: `ARCUS-A7B3C9D2`

### Step 3: View Your Codes

**In Supabase:**
1. Go to **Table Editor**
2. Click **representer_codes** table
3. You'll see all your codes with their status

**To see only unused codes:**
1. Go to **SQL Editor**
2. Run:
```sql
SELECT code, notes, created_at
FROM representer_codes
WHERE used = false
ORDER BY created_at DESC;
```

### Step 4: Send Codes to Representers

You can send codes via:
- Email
- Instagram DM
- Text message
- Any messaging platform

**Example Message:**
```
Hey! Here's your exclusive access code for the Arcus Representers page:

Code: ARCUS-A7B3C9D2

Visit: https://arcuswear.com/representers
Enter the code to see upcoming drops and pricing.

Note: This code can only be used once, so keep it safe!
```

### Step 5: Monitor Code Usage

**See all used codes:**
```sql
SELECT code, used_at, notes
FROM representer_codes
WHERE used = true
ORDER BY used_at DESC;
```

**See how many codes are left:**
```sql
SELECT
  COUNT(*) FILTER (WHERE used = false) as unused,
  COUNT(*) FILTER (WHERE used = true) as used,
  COUNT(*) as total
FROM representer_codes;
```

## Managing Codes

### Add a Single Code Manually
```sql
INSERT INTO representer_codes (code, notes)
VALUES ('CUSTOM-CODE-123', 'For John Doe');
```

### Delete a Code (Before it's used)
```sql
DELETE FROM representer_codes
WHERE code = 'ARCUS-A7B3C9D2' AND used = false;
```

### Reset a Used Code (Allow it to be used again)
```sql
UPDATE representer_codes
SET used = false, used_at = null
WHERE code = 'ARCUS-A7B3C9D2';
```

### Add Notes to Track Who Gets What
```sql
UPDATE representer_codes
SET notes = 'Sent to @johndoe on Instagram'
WHERE code = 'ARCUS-A7B3C9D2';
```

## Changing the Master Code

To change `arcus2025` to something else:

1. Open the file: `/Users/aryanmotgi/Downloads/ArcusWeb-main/.env`
2. Change the line:
   ```
   VITE_REPRESENTER_ACCESS_CODE=arcus2025
   ```
   to:
   ```
   VITE_REPRESENTER_ACCESS_CODE=your-new-code-here
   ```
3. Save the file
4. The dev server will restart automatically
5. For production, make sure to update the env variable on your hosting platform

## Troubleshooting

### Code says "Invalid or already used"
- Check if the code was already used in Supabase
- Make sure there are no extra spaces before/after the code
- Codes are case-sensitive

### Code not working at all
- Make sure the Supabase table was created (Step 1)
- Check that the code exists in the database
- Verify RLS policies are enabled

### Want to see who used which code?
Currently codes don't track the user. To add this:
1. Modify the login form to ask for email
2. Update the code to save the email when marking as used

## Quick Reference SQL Queries

```sql
-- Create 50 codes at once
INSERT INTO representer_codes (code, notes)
SELECT
  'ARCUS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  'Batch ' || NOW()::DATE
FROM generate_series(1, 50);

-- Export all unused codes (copy/paste into spreadsheet)
SELECT code FROM representer_codes WHERE used = false;

-- Delete all used codes (cleanup)
DELETE FROM representer_codes WHERE used = true;

-- See recent activity
SELECT code, used, used_at, notes
FROM representer_codes
ORDER BY created_at DESC
LIMIT 20;
```

## How It Works

1. User goes to /representers
2. Enters a code
3. System checks:
   - Is it the master code? → Let them in
   - Is it in the database AND unused? → Mark as used, let them in
   - Otherwise → Show error
4. Once logged in, they stay logged in until they close the browser

## Security Notes

- Codes are checked client-side (visible in browser code)
- This is basic access control, not high security
- Master code is visible in the deployed .env
- One-time codes prevent sharing after use
- For production-grade security, consider server-side authentication
