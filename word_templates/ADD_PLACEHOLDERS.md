# 🎯 **ADD THESE PLACEHOLDERS TO YOUR WORD TEMPLATES**

Your AI system is working! Now add these placeholders to your official government Word documents to enable automatic filling.

## 📝 **PE3_template.docx Placeholders**

Open your `PE3_template.docx` file and replace blank fields with these placeholders:

### **Header Information:**
```
Penalty Charge Notice Number: {penaltyChargeNumber}
Vehicle Registration Mark: {vehicleRegistration}
Date of Contravention: {dateOfContravention}
Location of Contravention: {locationOfContravention}
```

### **Applicant Details:**
```
Full Name: {applicantName}
Address: {applicantAddress}
Postcode: {applicantPostcode}
```

### **Respondent Details (BLOCK CAPITALS):**
```
Full Name: {respondentName}
Address: {respondentAddress}
```

### **Declaration Checkboxes:**
Replace checkbox areas with:
```
{didNotReceiveNotice} I did not receive the Notice to Owner/Enforcement Notice/Penalty Charge Notice
{madeRepresentationsNoResponse} I made representations but did not receive a rejection notice
{appealedNoResponse} I appealed to the Parking/Traffic Adjudicator but received no response
```

### **Reasons Section:**
```
{reasonForDeclaration}
```

### **Signature Section:**
```
Signature: ________________________
Date: {signatureDate}
```

### **Witness Details:**
```
Witness Name: {witnessName}
Witness Type: {witnessType}
Witness Address: {witnessAddress}
```

---

## 📝 **PE2_template.docx Placeholders**

Open your `PE2_template.docx` file and add these placeholders:

### **Court Details:**
```
Court Name: {courtName}
Court Address: {courtAddress}
```

### **Penalty Information:**
```
Penalty Charge Number: {penaltyChargeNumber}
Vehicle Registration: {vehicleRegistration}
Date of Contravention: {dateOfContravention}
Location of Contravention: {locationOfContravention}
```

### **Applicant Details:**
```
Full Name: {applicantName}
Address: {applicantAddress}
Postcode: {applicantPostcode}
```

### **Respondent Details (BLOCK CAPITALS):**
```
Full Name: {respondentName}
Address: {respondentAddress}
```

### **Late Filing Reasons:**
```
Reasons for filing out of time: {reasonsForLateFiling}
```

### **Signature Section:**
```
Signature: ________________________
Date: {signatureDate}
```

### **Witness Details:**
```
Witness Name: {witnessName}
Witness Type: {witnessType}
Witness Address: {witnessAddress}
```

---

## 🔧 **How to Add Placeholders:**

1. **Open each .docx file in Microsoft Word**
2. **Find blank form fields** (like lines, boxes, etc.)
3. **Delete the blank line/box**
4. **Type the placeholder** (like `{applicantName}`)
5. **Save the file**

### **Example:**

**Before:**
```
Applicant Name: _________________________
```

**After:**
```
Applicant Name: {applicantName}
```

## ✅ **Test Your Changes:**

After adding placeholders, run:
```bash
npx tsx test-ai-templates.ts
```

If placeholders are working, you'll see your test data filled in the generated documents!

## 🎯 **Result:**

When users fill out forms on your website, AI will automatically:
- Replace `{applicantName}` with "John Smith"
- Replace `{vehicleRegistration}` with "AB12 CDE"  
- Replace `{didNotReceiveNotice}` with "X" (if checked)
- And so on...

**Professional, court-ready documents generated automatically!** 🚀
