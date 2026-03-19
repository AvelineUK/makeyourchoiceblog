// api/subscribe.js
// Vercel serverless function — proxies subscription requests to Buttondown.
// Keeps the API key server-side so it's never exposed in the browser.
//
// Environment variable required:
//   BUTTONDOWN_API_KEY  — set this in your Vercel project settings

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;

  if (!apiKey) {
    console.error('BUTTONDOWN_API_KEY environment variable is not set.');
    return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
  }

  // Pass the visitor's IP through to Buttondown for list quality checks
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        tags: ['makeyourchoice-blog'],
        ...(ip && { ip_address: ip }),
      }),
    });

    const data = await response.json();

    // 201 = created
    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    // Handle already subscribed gracefully
    const detail = JSON.stringify(data);
    if (response.status === 422 && detail.toLowerCase().includes('already')) {
      return res.status(200).json({ success: true, alreadySubscribed: true });
    }

    const message = data?.detail
      || data?.email_address?.[0]
      || 'Something went wrong. Please try again.';

    return res.status(response.status).json({ error: message });

  } catch (err) {
    console.error('Buttondown API error:', err);
    return res.status(500).json({ error: 'Could not reach the subscription service. Please try again later.' });
  }
}
