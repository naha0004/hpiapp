# 🚗 **User Testing Guide - HPI Checks & Features**

This guide provides test credentials and sample data for regular users to test all main features of the HPI application.

## **🔑 Regular User Test Credentials**

For testing user features (non-admin):

**Email:** `user@test.com`  
**Password:** `user123`

## **🚗 Test Vehicle Registrations for HPI Checks**

Use these sample vehicle registrations to test HPI functionality:

- `AB12CDE` - Returns comprehensive mock data
- `TEST123` - Full risk analysis with warnings
- `XYZ789` - Complete vehicle history report  
- `DEMO1` - Sample data with multiple flags
- `YOUR123` - Test registration with all features

## **🎯 Features to Test**

### **1. HPI Vehicle Checks**
- **URL:** `http://localhost:3000/hpi-checks` (or your domain)
- **Test Flow:**
  1. Enter any test registration above
  2. View initial basic report
  3. Click "View Comprehensive Report" 
  4. Explore all detailed sections

### **2. MOT & Tax Reminders**
- **URL:** `http://localhost:3000/reminders`
- **Test Data:**
  - Vehicle Reg: Use any from above
  - Email: Your test email
  - Due Date: Any future date
  - Reminder Type: MOT Test or Vehicle Tax

### **3. Appeals System**
- **URL:** `http://localhost:3000/appeals`
- **Test Scenario:**
  - Ticket Number: `PCN123456789`
  - Vehicle Reg: `AB12CDE`
  - Fine Amount: `£60.00`
  - Location: `High Street Car Park, Birmingham`

### **4. TE7/TE9 Court Forms**
- Access through appeals system
- Test with sample penalty data above
- Download signed PDFs for testing

## **💡 Testing Tips**

### **HPI Checks:**
- All test registrations return HIGH RISK data
- Look for red warning indicators
- Check comprehensive report sections:
  - Vehicle Details
  - Finance Information  
  - Theft Check
  - Damage History
  - Mileage Verification

### **Reminders:**
- Email notifications work via Resend
- Test different notification timings (7, 14, 30, 60 days)
- Try recurring yearly reminders

### **Appeals:**
- Test AI-powered appeal generation
- Try different appeal reasons
- Download PDF versions of letters

## **🔍 Quick Test Checklist**

- [ ] Sign in with user credentials
- [ ] Run HPI check with test registration
- [ ] View comprehensive vehicle report
- [ ] Create MOT/Tax reminder
- [ ] Start parking appeal process
- [ ] Generate TE7 or TE9 court form
- [ ] Download PDF documents
- [ ] Test email notifications

## **📱 Mobile Testing**

All features are mobile-responsive. Test on:
- Desktop browser
- Mobile browser (iOS/Android)
- Different screen sizes

## **🚀 Ready to Test!**

1. **Start the app:** `pnpm dev` 
2. **Visit:** `http://localhost:3000`
3. **Sign in** with user credentials above
4. **Try each feature** with the test data provided

**Everything is set up for comprehensive user testing!** 🎉
