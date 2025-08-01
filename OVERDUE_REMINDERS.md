# Overdue Reminders Feature

## Overview

The overdue reminders feature automatically sends email reminders to clients for overdue invoices based on user preferences and intelligent scheduling rules.

## Features

### 1. Automatic Overdue Detection

- Invoices are automatically marked as "overdue" when past their due date
- System tracks overdue status in real-time

### 2. Smart Reminder Scheduling

- **First Reminder**: Sent 1 day after invoice becomes overdue
- **Follow-up Reminders**: Sent every 7 days until payment received
- **Duplicate Prevention**: Won't send reminders more frequently than allowed

### 3. User Preference Controls

- **Settings Page**: Users can enable/disable overdue reminders
- **Respect Preferences**: Reminders only sent if user has enabled them
- **Manual Override**: Users can send reminders manually regardless of settings

### 4. Professional Email Templates

- **Company Branding**: Uses saved company information from settings
- **Clear Information**: Shows invoice details, days overdue, amount due
- **Professional Format**: HTML emails with proper styling
- **Call to Action**: Clear instructions for payment

## How to Use

### For Users:

#### 1. Enable Overdue Reminders

1. Go to **Settings** page
2. In the **Notifications** section, enable "Overdue Reminders"
3. Click **Save Settings**

#### 2. Manual Reminder Sending

- **Single Invoice**: In invoice view, click "Send Reminder" button (only visible for overdue invoices)
- **Bulk Reminders**: In invoices list, click "Send Overdue Reminders" to send to all overdue invoices

#### 3. Track Reminder History

- Invoice model tracks when reminders were sent
- View reminder count and last sent date in invoice details

### For Developers:

#### API Endpoints

1. **Manual Reminders**: `POST /api/overdue-reminders`

   ```json
   {
     "invoiceId": "optional-specific-invoice-id",
     "manualTrigger": true
   }
   ```

2. **Auto Reminder Check**: `GET /api/auto-reminders`
   - Returns list of invoices that need reminders

3. **Auto Reminder Process**: `POST /api/auto-reminders`
   - Processes all eligible invoices for reminders

#### Database Schema Updates

```typescript
// Added to Invoice model
{
  sentAt?: Date;
  remindersSent?: Array<{
    type: "overdue";
    sentAt: Date;
    daysOverdue: number;
  }>;
  lastReminderSent?: Date;
}
```

## Configuration

### Environment Variables

Uses existing email configuration:

- `RESEND_API_KEY`: For sending emails
- `RESEND_FROM_EMAIL`: Sender email address

### Reminder Rules

- **Minimum Days Before First Reminder**: 1 day
- **Interval Between Reminders**: 7 days
- **Maximum Reminders**: No limit (continues until paid)

## Email Template

The reminder emails include:

- Company header with contact information
- Overdue notice with days overdue count
- Invoice details (number, dates, amount)
- Professional footer
- Clear payment instructions

## Security & Privacy

- **Authentication Required**: All reminder operations require valid user session
- **User-Scoped**: Users can only send reminders for their own invoices
- **Preference Respect**: Automatic reminders respect user notification preferences
- **Manual Override**: Manual sending always works regardless of preferences

## Future Enhancements

Potential improvements:

- **Cron Job Integration**: Set up automatic daily checks
- **Email Templates**: Multiple template options
- **Escalation Rules**: Different reminders based on days overdue
- **Payment Integration**: Stop reminders automatically when payment received
- **Analytics**: Track reminder effectiveness and payment rates

## Testing

- Use the bulk reminder button to test with existing overdue invoices
- Check the auto-reminders endpoint to see which invoices are candidates
- Verify email delivery through Resend dashboard
- Test with different notification preference settings
