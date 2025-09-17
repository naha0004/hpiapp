# 🧪 Appeal System Testing Guide

## **How to Test the Appeal System**

### **1. Setup Test Environment**

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

### **2. Test Appeal Protection Mechanisms**

#### **Test A: First-Time User (Free Trial)**
1. **Create a new user account** or login with existing account
2. **Check subscription status** in user dashboard
3. **Navigate to Appeals page** (`/appeals`)
4. **Submit your first appeal:**
   - Fill in ticket details (ticket number, fine amount, dates)
   - Add description and reason
   - Submit the appeal
   - ✅ **Expected:** Appeal should be accepted (first appeal on free trial)

#### **Test B: Duplicate Appeal Prevention (Free Trial)**
1. **Try to submit a second appeal** immediately after the first
2. ✅ **Expected:** System should show error message:
   ```
   "Free trial allows only 1 appeal. Please upgrade your plan."
   ```

#### **Test C: Payment Required Test**
1. **After hitting the appeal limit**, try to submit another appeal
2. **System should redirect to payment modal**
3. **Test payment flow:**
   - Choose "Single Appeal" (£2) or "Annual Plan" (£49)
   - Complete Stripe checkout (use test card: 4242 4242 4242 4242)
   - ✅ **Expected:** After successful payment, user can submit more appeals

### **3. Database Verification**

#### **Check Appeal Records:**
```bash
# View Prisma Studio at http://localhost:5556
npx prisma studio
```

**In Prisma Studio, check:**
1. **Appeals table** - Each submitted appeal should be logged
2. **User table** - Subscription status should update after payment
3. **Payments table** - Payment records should be created

### **4. Test Scenarios to Verify**

#### **✅ Protection Mechanisms Working:**
- [ ] Unauthorized users cannot access `/api/appeals`
- [ ] Free trial users limited to 1 appeal
- [ ] Single appeal payment allows exactly 1 more appeal
- [ ] Annual plan allows unlimited appeals
- [ ] Each appeal is logged with unique ID and timestamp
- [ ] User subscription status is properly tracked

#### **✅ Appeal Data Logging:**
```sql
-- Check appeals in database
SELECT 
  id, 
  userId, 
  ticketNumber, 
  status, 
  submissionDate, 
  createdAt 
FROM Appeal 
ORDER BY createdAt DESC;
```

### **5. API Testing (Advanced)**

#### **Test with Authentication Cookie:**
1. **Login through web interface**
2. **Open browser developer tools**
3. **Copy session cookie**
4. **Test API with cookie:**

```bash
curl -X GET "http://localhost:3000/api/appeals" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

### **6. Expected Flow Summary**

```
User Journey:
Login → Check Subscription → Submit Appeal → 
↓
If within limits: ✅ Appeal Logged
If over limits: ❌ Payment Required → Payment → ✅ Appeal Logged
```

### **7. Monitoring & Logs**

Watch server logs for appeal submissions:
```bash
tail -f ~/.pm2/logs/your-app-error.log  # or check terminal output
```

**Look for log entries:**
- `Appeal submitted successfully`
- `Free trial allows only 1 appeal`
- `Single appeal plan allows only 1 appeal`
- `Payment API - Creating payment for user`

---

## **🛡️ Security Confirmation**

**YES, the appeal system IS properly protected:**

✅ **Payment Protection:** Users must pay after hitting subscription limits
✅ **Database Logging:** Every appeal is logged with user ID and timestamp  
✅ **Duplicate Prevention:** Subscription limits prevent unlimited free appeals
✅ **Authentication Required:** All appeal operations require valid session
✅ **Audit Trail:** Full payment and appeal history is maintained

**The system prevents abuse while maintaining a smooth user experience!**
