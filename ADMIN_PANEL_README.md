# ClearRideAI Admin Panel

A super secure admin panel for managing users, appeals, payments, and analytics.

## Features

### 🔐 Security
- **Role-based access control** with granular permissions
- **Admin email verification** - only specific emails can access admin features
- **Session-based authentication** with NextAuth.js integration
- **Request validation** with Zod schemas
- **Data sanitization** - sensitive data is masked in responses

### 👥 User Management
- **View all users** with pagination and search
- **Filter by subscription type** (Free Trial, Single Appeal, Annual Plan)
- **User activity overview** - appeals, HPI checks, payments count
- **Activate/Deactivate users** with one-click toggle
- **Detailed user profiles** with complete history
- **Safe user deletion** with data integrity checks

### 📊 Analytics Dashboard
- **Real-time metrics** - users, revenue, appeals, HPI checks
- **Appeal status breakdown** - track success rates
- **Payment analytics** - revenue by type and period
- **Subscription distribution** - user plan insights
- **Time-based filtering** - 7d, 30d, 90d, 1y periods

### 🚀 API Endpoints

#### User Management
- `GET /api/admin/users` - List all users with filtering
- `GET /api/admin/users/[id]` - Get detailed user information
- `PATCH /api/admin/users/[id]` - Update user status/details
- `DELETE /api/admin/users/[id]` - Delete user (with safety checks)

#### Analytics
- `GET /api/admin/analytics` - Comprehensive platform analytics

## Setup Instructions

### 1. Configure Admin Access

Update your environment variables or admin configuration:

```typescript
// lib/admin-auth.ts
const ADMIN_EMAILS = [
  'your-admin@email.com',
  'another-admin@email.com'
]
```

### 2. Admin Permissions

The system uses a granular permission system:

- `VIEW_USERS` - Can view user lists and profiles
- `MANAGE_USERS` - Can activate/deactivate and update users
- `DELETE_USERS` - Can delete users (requires MANAGE_USERS)
- `VIEW_ANALYTICS` - Can access analytics dashboard
- `SYSTEM_ADMIN` - Full access to all features

### 3. Access the Admin Panel

Navigate to `/admin` in your browser. You must be:
1. Signed in with NextAuth.js
2. Using an email address listed in `ADMIN_EMAILS`
3. Have the required permissions

## Security Features

### Data Protection
- **Email masking** - User emails are partially hidden (e.g., `jo***@example.com`)
- **Secure deletion** - Users with appeals/payments cannot be deleted
- **Transaction safety** - All database operations use transactions
- **Input validation** - All requests validated with Zod schemas

### Access Control
- **Authentication required** - All admin routes protected
- **Permission checks** - Each endpoint verifies specific permissions
- **Session validation** - Admin status checked on every request
- **Automatic redirects** - Unauthorized access redirects to sign-in

### Audit Trail
- **Error logging** - All admin actions logged to console
- **Request validation** - Invalid requests logged with details
- **Permission violations** - Unauthorized access attempts logged

## Usage Examples

### Managing Users
1. **Search users**: Enter name, email, or registration in search box
2. **Filter by subscription**: Use dropdown to filter by plan type
3. **Toggle user status**: Click "Activate/Deactivate" button
4. **View user details**: Click on user to see detailed profile

### Viewing Analytics
1. **Switch time period**: Select 7d, 30d, 90d, or 1y
2. **Monitor key metrics**: Track users, revenue, appeals, HPI checks
3. **Analyze trends**: View subscription distribution and appeal success rates

### Security Best Practices
1. **Limit admin emails** - Only add trusted administrators
2. **Regular audits** - Monitor admin access logs
3. **Environment protection** - Keep admin emails in secure environment variables
4. **Session management** - Ensure proper logout and session expiry

## Database Schema

The admin panel works with your existing Prisma schema, requiring:
- `User` model with subscription and activity tracking
- `Appeal` model with status and user relationships
- `Payment` model with amount and type information
- `HPICheck` model for vehicle verification tracking

## Troubleshooting

### Access Denied
- Verify your email is in the `ADMIN_EMAILS` list
- Ensure you're signed in with NextAuth.js
- Check server logs for permission errors

### Data Not Loading
- Verify database connection
- Check Prisma schema matches expectations
- Review server console for API errors

### Performance Issues
- Consider adding database indexes for large datasets
- Implement caching for analytics data
- Use database connection pooling

## Support

For technical support or feature requests, contact your development team or review the codebase documentation.
