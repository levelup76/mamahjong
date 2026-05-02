Project secrets and GitHub Secrets setup

Required environment variables (copy into `.env.local` for local dev):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-deploy-url`)
- `GOOGLE_CLIENT_ID` (if you configure Google OAuth outside Supabase)
- `GOOGLE_CLIENT_SECRET`

Recommended GitHub Secrets (set these in the repository to allow CI/deploy):

```bash
# set each secret (replace values with real credentials)
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://YOUR-PROJECT.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "YOUR-ANON-KEY"
gh secret set NEXT_PUBLIC_SITE_URL --body "https://your-deploy-url"
gh secret set GOOGLE_CLIENT_ID --body "your-google-client-id"
gh secret set GOOGLE_CLIENT_SECRET --body "your-google-client-secret"
```

Notes:
- Supabase's anon key is considered public but it's convenient to store in Secrets for CI/deploy.
- If you use Vercel, you can set the same env vars in the Vercel project dashboard.
- Do not commit `.env.local` to the repo.
