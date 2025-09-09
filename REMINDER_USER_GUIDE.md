# How to Create MOT & Tax Reminders with Email Notifications

This guide shows you exactly where and how to create vehicle reminders that will send professional email notifications via Resend.

## 🎯 **Where to Create Reminders**

### 1. **Dedicated Reminders Page**
- **URL**: `http://localhost:3000/reminders` (or `https://yourdomain.com/reminders`)
- **Component**: `/components/real-reminders.tsx`
- **Features**: Full-featured reminder management interface

### 2. **API Integration**
- **Endpoint**: `POST /api/reminders`
- **Direct API calls** for integrating reminders into other parts of your app

## 📋 **Required Information**

When creating a reminder, users **must provide**:

### ✅ **Essential Fields**
1. **Email Address** - Where reminders will be sent
2. **Reminder Type** - MOT Test, Vehicle Tax, Insurance, etc.
3. **Vehicle Registration** - UK registration number (e.g., AB12 CDE)
4. **Reminder Title** - Descriptive name
5. **Due Date** - When the MOT/Tax expires

### 🔧 **Optional Fields**
- Vehicle Make (Ford, BMW, etc.)
- Vehicle Model (Focus, 3 Series, etc.)
- Vehicle Year
- Custom description
- Notification timing (7, 14, 30, or 60 days before)
- Recurring reminders (yearly for MOT/Tax)

## 💻 **User Experience Flow**

### Step 1: Access the Reminders Page
```
Visit: http://localhost:3000/reminders
```

### Step 2: Sign In (Required)
- Users must be authenticated to create reminders
- Uses NextAuth session management
- Automatically fills email from user account

### Step 3: Create Reminder Form
The form prominently features:

```tsx
// Email field is highlighted in blue box at top of form
<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
  <Label>Email for Reminder Notifications *</Label>
  <Input type="email" placeholder="your-email@example.com" />
  <p>We'll send MOT and tax reminder emails to this address using our professional service from enmsservices.co.uk</p>
</div>
```

### Step 4: Email Integration
- Email is automatically saved to user profile
- Used by notification system to send reminders
- Professional emails sent from `noreply@enmsservices.co.uk`

## 🔌 **API Usage**

### Create Reminder via API
```javascript
const response = await fetch('/api/reminders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: "user-id",
    email: "user@example.com", // REQUIRED for notifications
    vehicleReg: "AB12CDE",
    reminderType: "MOT_TEST", // or "VEHICLE_TAX"
    title: "MOT Test - Honda Civic",
    dueDate: "2024-12-15",
    notifyDays: 30,
    make: "Honda",
    model: "Civic",
    year: 2018,
    isRecurring: true
  })
})
```

### Reminder Types Available
```typescript
"MOT_TEST"         // MOT certificate renewal
"VEHICLE_TAX"      // Vehicle tax renewal  
"INSURANCE"        // Insurance renewal
"SERVICE"          // Vehicle service
"FINE_PAYMENT"     // Traffic fine payment
"APPEAL_DEADLINE"  // Appeal deadline
"OTHER"            // Custom reminder
```

## 📧 **Email Notification System**

### Automatic Email Schedule
For each reminder, the system creates notifications at:
- **30 days before** due date (if selected)
- **14 days before** due date  
- **7 days before** due date
- **1 day before** due date

### Email Features
- **Professional HTML templates** with your branding
- **Vehicle-specific information** (make, model, year, registration)
- **Urgency indicators** (red for urgent, green for normal)
- **Direct links** to gov.uk services
- **Mobile-responsive** design
- **Plain text fallback** for all email clients

### Example Email Content
```
Subject: MOT Reminder: AB12 CDE - 14 days remaining

🚗 MOT Test Reminder
Your MOT certificate expires in 14 days!

Vehicle Details:
- Registration: AB12 CDE  
- Vehicle: Honda Civic (2018)
- MOT Due: 15/12/2024
- Days Remaining: 14 days

[Book MOT Test] button linking to gov.uk
```

## 🔄 **Automated Processing**

### Cron Job Setup
To automatically send scheduled emails:

```bash
# Set up cron job to run every hour
0 * * * * curl -X POST https://yourdomain.com/api/reminders/cron
```

### Manual Processing
```bash
# Process all pending notifications manually
curl -X POST http://localhost:3000/api/reminders/notifications
```

### Check Status
```bash
# See pending notifications
curl -X GET http://localhost:3000/api/reminders/cron
```

## 📱 **Integration Examples**

### Add to Navigation
```tsx
<Link href="/reminders">
  <Bell className="h-4 w-4" />
  MOT & Tax Reminders
</Link>
```

### Embed in Dashboard
```tsx
import { RealReminders } from "@/components/real-reminders"

function Dashboard() {
  return (
    <div>
      <h1>Your Dashboard</h1>
      <RealReminders />
    </div>
  )
}
```

### Vehicle Check Integration
After an HPI check, offer reminder creation:

```tsx
// After successful vehicle check
if (vehicleData.motExpiryDate) {
  // Show "Create MOT Reminder" button
  // Pre-fill form with vehicle data from HPI check
}
```

## 🛡️ **Security & Privacy**

- Email addresses are stored securely in user profiles
- Only authenticated users can create reminders
- Each user can only see their own reminders
- All email sending is logged for monitoring
- Unsubscribe functionality available (future enhancement)

## 🎯 **Key Benefits**

1. **Never Miss Deadlines** - Automated email reminders
2. **Professional Emails** - Branded from your domain
3. **Vehicle-Specific** - Personalized with vehicle details
4. **Multiple Reminders** - Several notifications leading up to due date
5. **Recurring Support** - Automatic yearly reminders for MOT/Tax
6. **Mobile Friendly** - Works on all devices
7. **Government Links** - Direct links to official services

## 📞 **Support**

The reminder system is fully integrated with your Traffic Appeal AI platform and uses the same user authentication and database. Users get professional reminder emails that reinforce your brand and help them stay compliant with UK vehicle requirements.

**Email Service**: Resend via `enmsservices.co.uk`  
**Templates**: Professional HTML + text versions  
**Frequency**: Multiple reminders per due date  
**Integration**: Seamless with existing user system
