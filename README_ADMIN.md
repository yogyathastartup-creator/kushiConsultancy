Admin account — create/update (bcrypt)

This project stores admin credentials in the `admins` collection in MongoDB.

- Passwords are stored using bcrypt (cost/rounds = 12 by default).

Create or update the admin user:

```powershell
# Provide username and password on the command line (recommended)
npm run create-admin -- --username admin --password MyStrongP@ssw0rd

# Or rely on .env values (not recommended for production):
# Set ADMIN_USERNAME and ADMIN_PASSWORD in .env then:
npm run create-admin
```

Notes:
- Do NOT commit your plaintext passwords or full `MONGODB_URI` with credentials to source control.
- The server will try to read admin credentials from the DB first and fall back to environment variables.
- To verify the admin document, check the `admins` collection; the `password` field should start with `$2` (bcrypt).
- If you previously added a plaintext admin (for testing), remove that document and re-run the create-admin script to replace it with a hashed password.

Security:
- Keep your MongoDB access restricted and rotate any credentials that were exposed.
- Prefer creating admins via the script which hashes passwords.
