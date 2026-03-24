import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'jsr:@supabase/supabase-js@2';
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

---
Follow us:
Instagram: https://www.instagram.com/arcuswear/
TikTok: https://www.tiktok.com/@arcuswear
    `;

    await resend.emails.send({
      from: 'Arcus <team@arcuswear.store>',
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

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-13c7a257/health", (c) => {
  return c.json({ status: "ok" });
});

// Endpoint to save email to waitlist
app.post("/make-server-13c7a257/waitlist", async (c) => {
  try {
    const { email } = await c.req.json();

    // Validate email is provided
    if (!email || email.trim() === '') {
      return c.json({ error: "Please provide an email address" }, 400);
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert into waitlist table (phone gets unique placeholder)
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.trim(),
        phone: `no-phone-${crypto.randomUUID()}`,
        source: 'landing_page'
      });

    if (error) {
      console.error('Error inserting into waitlist table:', error);

      // Check if it's a unique constraint violation (duplicate entry)
      if (error.code === '23505') {
        return c.json({ error: "You're already on the waitlist with this email." }, 400);
      }

      return c.json({ error: `Failed to save contact: ${error.message}` }, 500);
    }

    console.log(`Contact saved to waitlist table - email: ${email}`);

    // Send welcome email
    sendWelcomeEmail(email).catch(err =>
      console.error('Background email send failed:', err)
    );

    return c.json({ success: true, message: "Contact saved successfully" });
  } catch (error) {
    console.error('Error saving contact to waitlist:', error);
    return c.json({ error: `Failed to save contact: ${error.message || 'Unknown error'}` }, 500);
  }
});

// Endpoint to get all waitlist emails
app.get("/make-server-13c7a257/waitlist", async (c) => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('source', 'landing_page');
    
    if (error) {
      console.error('Error fetching waitlist entries:', error);
      return c.json({ error: `Failed to fetch contacts: ${error.message}` }, 500);
    }
    
    return c.json({ success: true, count: data?.length || 0, contacts: data });
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return c.json({ error: `Failed to fetch contacts: ${error.message || 'Unknown error'}` }, 500);
  }
});

Deno.serve(app.fetch);