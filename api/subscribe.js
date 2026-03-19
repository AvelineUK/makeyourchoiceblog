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

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: ['makeyourchoice-blog'],
      }),
    });

    const data = await response.json();

    // 201 = created, 200 = already subscribed (Buttondown behaviour)
    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    // Buttondown returns a detail field on errors
    const message = data?.detail
      || data?.email?.[0]
      || 'Something went wrong. Please try again.';

    // 400 with "already subscribed" isn't really an error from the user's perspective
    if (response.status === 400 && message.toLowerCase().includes('already')) {
      return res.status(200).json({ success: true, alreadySubscribed: true });
    }

    return res.status(response.status).json({ error: message });

  } catch (err) {
    console.error('Buttondown API error:', err);
    return res.status(500).json({ error: 'Could not reach the subscription service. Please try again later.' });
  }
}
