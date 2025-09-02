# Deploy Instructions for Render

## Steps:

1. **Upload all files** to your GitHub repo
2. **Set Render start command** to: `node start.js`
3. **Import your database** by running this in Render PostgreSQL:
   ```
   \i complete-database.sql
   ```
4. **Set environment variable** in Render:
   - `DATABASE_URL` = your Render PostgreSQL connection string

## Files included:
- Complete React app (compiled)
- Complete Node.js server (compiled)  
- All 1,527 parts + 589 staff + 53 buildings + 162 cost centers
- Proper startup script