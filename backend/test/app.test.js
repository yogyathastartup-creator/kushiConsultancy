import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

process.env.NODE_ENV = 'test';
// Credentials are generated per run so no password-like literal lives in the repository
const randomValue = () => randomBytes(12).toString('hex');
const ADMIN_USER = 'admin';
const ADMIN_PASS = randomValue();

process.env.ADMIN_USERNAME = ADMIN_USER;
process.env.ADMIN_PASSWORD = ADMIN_PASS;
process.env.JWT_SECRET = randomValue();
process.env.CORS_ORIGINS = 'https://staging.example.com';
process.env.MAIL_TO_ADDRESS = 'recruitment@example.com';
process.env.MAIL_FROM_ADDRESS = 'noreply@example.com';
process.env.UPLOAD_RATE_LIMIT_MAX = '1000';
delete process.env.RESEND_API_KEY;

const { default: app } = await import('../app.js');
const { escapeHtml, setEmailClient } = await import('../utils/emailService.js');

// Fake Resend client: records every email instead of sending it
const sentEmails = [];
let failNextSendTo = null;
setEmailClient({
  emails: {
    send: async (message) => {
      if (failNextSendTo && message.to === failNextSendTo) {
        failNextSendTo = null;
        return { data: null, error: { message: 'simulated outage' } };
      }
      sentEmails.push(message);
      return { data: { id: `email-${sentEmails.length}` }, error: null };
    }
  }
});

// The applicant confirmation is sent after the response, so give it a moment
const waitForEmails = async (count) => {
  for (let i = 0; i < 50 && sentEmails.length < count; i++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

const login = (username, password) => fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const cvForm = (fileBytes, fileName, type, overrides = {}) => {
  const form = new FormData();
  const fields = {
    name: 'Asha Kumar',
    email: 'asha@example.com',
    phone: '+91 98765 43210',
    position: 'Structural Engineer',
    experience: '5 years',
    location: 'Chennai',
    ...overrides
  };
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  form.append('cv', new Blob([fileBytes], { type }), fileName);
  return form;
};

describe('health and routing', () => {
  for (const path of ['/', '/health', '/api/health']) {
    test(`GET ${path} returns OK`, async () => {
      const res = await fetch(baseUrl + path);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).status, 'OK');
    });
  }

  test('GET /api/version returns package info', async () => {
    const res = await fetch(`${baseUrl}/api/version`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).name, 'kushi-consultancy-backend');
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).success, false);
  });

  test('sets security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('strict-transport-security'));
  });
});

describe('CORS', () => {
  for (const origin of ['https://kushiconsultancy.com', 'https://www.kushiconsultancy.com', 'https://staging.example.com']) {
    test(`allows ${origin}`, async () => {
      const res = await fetch(`${baseUrl}/api/health`, { headers: { Origin: origin } });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), origin);
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    });
  }

  test('rejects an unknown origin with 403', async () => {
    const res = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });
});

describe('authentication', () => {
  test('rejects missing fields', async () => {
    const res = await login('', '');
    assert.equal(res.status, 400);
  });

  test('rejects wrong password', async () => {
    const res = await login(ADMIN_USER, randomValue());
    assert.equal(res.status, 401);
  });

  test('rejects non-string credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ['admin'], password: { $ne: '' } })
    });
    assert.equal(res.status, 400);
  });

  test('login, verify, logout round trip', async () => {
    const res = await login(ADMIN_USER, ADMIN_PASS);
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /accessToken=/);
    assert.match(setCookie, /HttpOnly/);
    const cookie = setCookie.split(';')[0];

    const verify = await fetch(`${baseUrl}/api/auth/verify`, { headers: { Cookie: cookie } });
    assert.equal(verify.status, 200);
    assert.deepEqual((await verify.json()).user, { username: ADMIN_USER, role: 'admin' });

    const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /accessToken=;.*Expires=Thu, 01 Jan 1970/);
  });

  test('verify rejects a missing or forged token', async () => {
    assert.equal((await fetch(`${baseUrl}/api/auth/verify`)).status, 401);
    const forged = await fetch(`${baseUrl}/api/auth/verify`, {
      headers: { Cookie: 'accessToken=eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.' }
    });
    assert.equal(forged.status, 401);
  });

  test('supports a bcrypt-hashed ADMIN_PASSWORD', async () => {
    const { default: bcrypt } = await import('bcrypt');
    const original = ADMIN_PASS;
    const plain = randomValue();
    process.env.ADMIN_PASSWORD = await bcrypt.hash(plain, 4);
    try {
      assert.equal((await login(ADMIN_USER, plain)).status, 200);
      assert.equal((await login(ADMIN_USER, randomValue())).status, 401);
    } finally {
      process.env.ADMIN_PASSWORD = original;
    }
  });
});

describe('test email endpoint', () => {
  test('requires admin login', async () => {
    const res = await fetch(`${baseUrl}/api/email/test`, { method: 'POST' });
    assert.equal(res.status, 401);
  });

  test('GET is no longer exposed', async () => {
    const res = await fetch(`${baseUrl}/api/email/test`);
    assert.equal(res.status, 404);
  });
});

describe('CV upload', () => {
  const pdfBytes = Buffer.from('%PDF-1.4\n%test\n');

  test('accepts a valid PDF', async () => {
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf')
    });
    const body = await res.json();
    assert.equal(res.status, 200, JSON.stringify(body));
    assert.equal(body.success, true);
  });

  test('emails the CV to recruitment and a confirmation to the applicant', async () => {
    sentEmails.length = 0;
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf', { email: 'Asha.Kumar@Example.com' })
    });
    assert.equal(res.status, 200);
    await waitForEmails(2);
    assert.equal(sentEmails.length, 2);

    const [notification, confirmation] = sentEmails;
    assert.equal(notification.to, 'recruitment@example.com');
    assert.equal(notification.replyTo, 'asha.kumar@example.com');
    assert.equal(notification.attachments.length, 1);
    assert.equal(notification.attachments[0].filename, 'resume.pdf');
    assert.ok(Buffer.from(notification.attachments[0].content).equals(pdfBytes));

    assert.equal(confirmation.to, 'asha.kumar@example.com');
    assert.match(confirmation.subject, /Application received: Structural Engineer/);
    assert.match(confirmation.html, /Dear Asha Kumar/);
    assert.equal(confirmation.attachments, undefined);
  });

  test('escapes applicant text in both emails', async () => {
    sentEmails.length = 0;
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf', { position: '<a href="https://evil.example">Click</a>' })
    });
    assert.equal(res.status, 200);
    await waitForEmails(2);
    for (const email of sentEmails) {
      assert.doesNotMatch(email.html, /<a href="https:\/\/evil/);
    }
  });

  test('reports failure and sends no confirmation when the CV email cannot be sent', async () => {
    sentEmails.length = 0;
    failNextSendTo = 'recruitment@example.com';
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf')
    });
    assert.equal(res.status, 502);
    assert.equal((await res.json()).success, false);
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(sentEmails.length, 0);
  });

  test('still succeeds when only the confirmation email fails', async () => {
    sentEmails.length = 0;
    failNextSendTo = 'asha@example.com';
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf')
    });
    assert.equal(res.status, 200);
    await waitForEmails(1);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].to, 'recruitment@example.com');
  });

  test('rejected uploads send no email', async () => {
    sentEmails.length = 0;
    await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(Buffer.from('not a pdf'), 'resume.pdf', 'application/pdf')
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(sentEmails.length, 0);
  });

  test('accepts a valid DOCX', async () => {
    const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(docx, 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    });
    assert.equal(res.status, 200);
  });

  test('rejects a file whose content is not really a PDF', async () => {
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(Buffer.from('MZ\x90\x00 fake exe'), 'resume.pdf', 'application/pdf')
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /does not match/);
  });

  test('rejects a disallowed MIME type', async () => {
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(Buffer.from('hello'), 'resume.txt', 'text/plain')
    });
    assert.equal(res.status, 400);
  });

  test('rejects a mismatched extension', async () => {
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.exe', 'application/pdf')
    });
    assert.equal(res.status, 400);
  });

  test('rejects a file over 5MB', async () => {
    const big = Buffer.concat([pdfBytes, Buffer.alloc(5 * 1024 * 1024 + 1)]);
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(big, 'resume.pdf', 'application/pdf')
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'File too large');
  });

  test('rejects invalid applicant fields', async () => {
    const res = await fetch(`${baseUrl}/api/upload/cv`, {
      method: 'POST',
      body: cvForm(pdfBytes, 'resume.pdf', 'application/pdf', { name: '<script>', email: 'not-an-email' })
    });
    assert.equal(res.status, 400);
    const fields = (await res.json()).errors.map(e => e.path);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('email'));
  });

  test('rejects a request with no file', async () => {
    const form = cvForm(pdfBytes, 'resume.pdf', 'application/pdf');
    form.delete('cv');
    const res = await fetch(`${baseUrl}/api/upload/cv`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
  });
});

describe('escapeHtml', () => {
  test('escapes HTML special characters', () => {
    assert.equal(
      escapeHtml(`<a href="x" onclick='y'>&</a>`),
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });

  test('handles null and numbers', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(5), '5');
  });
});
