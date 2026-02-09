# How to Get Your Supabase Database URL

1.  **Log in** to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project ("Quantifex" or similar).
3.  Click the **"Connect"** button in the top header.
4.  Switch to the **"Transaction Pooler"** tab (recommended for serverless/Lambda) or "Direct" (standard).
    *   *Note*: Since we are migrating to AWS Lambda, "Transaction Pooler" (port 6543) is usually better, but "Direct" (port 5432) works fine for initial testing.
5.  Copy the connection string. It looks like:
    ```
    postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
    ```
6.  **Replace `[password]`** with the database password you created when you started the project.
7.  Paste this entire string into `backend/.env` as `DATABASE_URL`.

## Next Steps
Once you save the `.env` file, run:
```bash
cd backend
npx sequelize-cli db:migrate
```
This will create your tables.
