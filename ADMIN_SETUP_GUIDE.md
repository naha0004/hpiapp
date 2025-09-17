# Single Admin Configuration Guide

## Setting Up YOUR Admin Access (Owner Only)

This admin panel is configured for **ONLY ONE PERSON** - the owner of ClearRideAI. No other users will ever have admin access.

### 1. Environment Variables Method (Recommended)

Add these to your `.env.local` file:

```bash
# Your admin credentials (ONLY YOURS)
ADMIN_EMAIL=your-actual-email@gmail.com
ADMIN_PHONE=+44youractualnumber
```

### 2. Direct Code Configuration (Alternative)

Edit `/Users/nahavipusans/Desktop/hpi/lib/admin-auth.ts` and modify:

```typescript
const ADMIN_EMAIL = 'your-actual-email@gmail.com'
const ADMIN_PHONE = '+44youractualnumber'
```

## Security Features

✅ **Single Admin Only** - Only YOUR email/phone can access  
✅ **Full Permissions** - You automatically get all admin rights  
✅ **No User Access** - Impossible for regular users to become admin  
✅ **Secure by Design** - Hardcoded to prevent unauthorized access

## Quick Setup (2 Steps)

### Step 1: Set Your Credentials
Add to `.env.local`:
```bash
ADMIN_EMAIL=your-actual-email@gmail.com
ADMIN_PHONE=+44youractualnumber
```

### Step 2: Access Admin Panel
1. Sign in with NextAuth.js using your admin email
2. Navigate to `/admin`
3. You'll have full admin access automatically!

## Phone Number Format

Use your phone number with country code:
- UK: `+447123456789`
- US: `+11234567890`
- Other countries: `+[country code][number]`

## How It Works

1. **You sign in** with your email through NextAuth.js
2. **System checks** if your email matches `ADMIN_EMAIL`
3. **System checks** if your phone (from database) matches `ADMIN_PHONE`  
4. **If either matches** → Full admin access granted
5. **If neither matches** → Access completely denied

## Super Secure Design

- **Hardcoded single admin** - impossible for others to access
- **No permission levels** - you get everything automatically  
- **No user escalation** - regular users can never become admin
- **Owner-only access** - designed specifically for business owner

## Troubleshooting

### "Unauthorized: Admin access required"
- Check your email/phone is in the authorized lists
- Verify environment variables are set correctly
- Ensure you're signed in with the correct account

### "Unauthorized: Missing permission"
- Check the `ADMIN_PERMISSIONS` object includes your email/phone
- Verify you have the required permission for the action
- Consider adding `SUPER_ADMIN` permission for full access

### Phone Number Issues
- Ensure country code is included (+44, +1, etc.)
- Check for typos in phone number format
- Verify normalization is working (remove spaces/hyphens/parentheses)

## Quick Setup Example

For immediate testing, add this to your `.env.local`:

```bash
ADMIN_EMAIL_1=your-actual-email@gmail.com
ADMIN_PHONE_1=+44youractualphonenumber
```

Then the system will automatically grant you super admin access!
