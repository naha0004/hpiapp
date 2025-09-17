# 🔐 **Admin Login Test - Email & Password**

I've set up a test user for you to test the actual email/password login flow!

## **Test Credentials:**

**Email:** `test@admin.com`  
**Password:** `admin123`

## **How to Test Login Flow:**

### **Step 1: Go to Admin Page (Requires Login)**
Navigate to: `http://localhost:3001/admin/login-test`

### **Step 2: You'll Be Redirected to Sign-In**
Since you're not logged in, you'll be automatically redirected to the NextAuth sign-in page

### **Step 3: Sign In with Credentials**
1. Choose **"Sign in with Credentials"**
2. Enter:
   - **Email:** `test@admin.com`
   - **Password:** `admin123`
3. Click **Sign In**

### **Step 4: Access Admin Dashboard**
After successful login, you'll be redirected back to the admin dashboard with full access!

## **✅ What This Tests:**

- ✅ **Email/Password Authentication** - Real NextAuth credentials flow
- ✅ **Admin Permission Check** - Verifies you're in admin list  
- ✅ **Automatic Redirects** - Sign-in → Admin dashboard flow
- ✅ **Session Management** - Stay logged in across page refreshes

## **🔑 Test URLs:**

**Main Admin (Requires Login):** `http://localhost:3001/admin/login-test`  
**NextAuth Sign-in Page:** `http://localhost:3001/api/auth/signin`  
**Test Admin (No Login):** `http://localhost:3001/admin/test` *(bypass version)*

## **🎯 Expected Flow:**

1. **Visit admin page** → Redirected to sign-in
2. **Enter credentials** → Authentication happens  
3. **Admin check** → Verifies test@admin.com is authorized
4. **Dashboard access** → Full admin panel loads

**Now you can test the complete email/password login flow!** 🚀
