# MOT and Tax Reminder Service with Resend Integration

This system provides automated MOT and vehicle tax reminder emails using Resend API.

## Configuration

- **Domain**: `enmsservices.co.uk`
- **From Email**: `noreply@enmsservices.co.uk`
- **API Key**: Configured in `lib/resend-email-service.ts`

## Features

### ✅ Email Templates
- **MOT Reminders**: Professional HTML/text emails with vehicle details, urgency indicators, and helpful links
- **Tax Reminders**: Comprehensive emails with renewal instructions and payment options
- **Multi-format**: Both HTML and plain text versions for better compatibility

### ✅ Smart Scheduling
- Multiple notification schedule: 30, 14, 7, and 1 days before due date
- Urgency-based styling (red for urgent, green for normal)
- Automatic recurring reminders for yearly renewals

### ✅ API Endpoints

#### Test Email Functionality
```
POST /api/reminders/test-email
```
**Body:**
```json
{
  "email": "your-email@example.com",
  "type": "test|mot|tax"
}
```

#### Process Pending Notifications
```
POST /api/reminders/notifications
```
Processes all pending notifications and sends emails via Resend.

#### Cron Job Endpoint
```
POST /api/reminders/cron
GET /api/reminders/cron
```
- POST: Processes all pending notifications (for automated cron jobs)
- GET: Shows pending notification status

## Usage Examples

### 1. Test the Email Service
```bash
curl -X POST http://localhost:3000/api/reminders/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "type": "test"}'
```

### 2. Test MOT Reminder Email
```bash
curl -X POST http://localhost:3000/api/reminders/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "type": "mot"}'
```

### 3. Test Tax Reminder Email
```bash
curl -X POST http://localhost:3000/api/reminders/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "type": "tax"}'
```

### 4. Process All Pending Notifications
```bash
curl -X POST http://localhost:3000/api/reminders/notifications \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 5. Check Pending Notifications Status
```bash
curl -X GET http://localhost:3000/api/reminders/cron
```

## Email Templates

### MOT Reminder Features:
- 🚗 Vehicle details (registration, make, model, year)
- 📅 Days remaining until MOT due
- ⚠️ Urgency indicators for approaching deadlines
- 🔍 Direct links to gov.uk MOT booking
- 💡 Pro tips about MOT requirements
- 🚨 Warning about penalties for expired MOT

### Tax Reminder Features:
- 💰 Vehicle tax renewal information
- 📋 Step-by-step renewal instructions
- 🌐 Multiple renewal methods (online, phone, post office)
- 📄 Required documents checklist
- ⚠️ Penalties for expired tax warnings
- 💳 Payment options information

## Automation

### Setting up Cron Jobs
You can set up automated processing using:

1. **External Cron Service** (like cron-job.org):
   - URL: `https://yourapp.com/api/reminders/cron`
   - Method: POST
   - Frequency: Every hour or daily

2. **Server Cron Job**:
   ```bash
   # Add to crontab (run every hour)
   0 * * * * curl -X POST https://yourapp.com/api/reminders/cron
   ```

3. **Vercel Cron** (if using Vercel):
   ```json
   {
     "crons": [
       {
         "path": "/api/reminders/cron",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

## Database Schema

The system uses existing reminder tables:
- `VehicleReminder`: Stores reminder details
- `VehicleReminderNotification`: Stores notification schedule and status

## Security

- API key is hardcoded in the service (consider moving to environment variables for production)
- Emails only sent for authenticated users with valid email addresses
- All errors are logged but don't expose sensitive information

## Monitoring

Check logs for:
- ✅ `Sent MOT/TAX reminder to email@domain.com for vehicle ABC123`
- ❌ `Failed to send reminder` with error details
- 📊 Processing statistics in cron job responses

## Next Steps

1. **Test the integration**: Use the test endpoints to verify email delivery
2. **Set up monitoring**: Monitor the cron endpoint for successful processing
3. **Configure automation**: Set up regular cron jobs to process notifications
4. **Add environment variables**: Move API key to secure environment variables
5. **Add unsubscribe**: Implement unsubscribe functionality for users

## Support

The system integrates with your existing Traffic Appeal AI platform and uses the same user database for email addresses.
