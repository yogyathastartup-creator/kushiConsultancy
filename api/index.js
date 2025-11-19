// Vercel Serverless Function entrypoint

// This is a simplified test function.
// It bypasses the Express app to check if the serverless environment is working.
export default function handler(req, res) {
  // Add CORS headers to allow requests from your frontend domain
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://kushi-cosultancy.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Send a test response for any other request
  res.status(200).json({ message: 'API is alive!' });
}
