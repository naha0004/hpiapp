# Word Document Templates for AI Form Filling

This directory contains the official government Word document templates that will be automatically filled by AI with user data.

## 🎯 **YOU UPLOAD HERE:** Official Government Word Documents

### Step 1: Download Official Forms
Download these official government Word documents:

- **PE2 Form:** Application to file a Statutory Declaration Out of Time
  - Download from: [gov.uk court forms](https://www.gov.uk/government/publications/court-forms)
  - Save as: `PE2_template.docx`

- **PE3 Form:** Statutory Declaration (unpaid penalty charge)  
  - Download from: [gov.uk court forms](https://www.gov.uk/government/publications/court-forms)
  - Save as: `PE3_template.docx`

### Step 2: Prepare Templates for AI Filling

Once you upload the Word documents, you'll need to add placeholders that the AI can fill automatically.

#### **Placeholder Format:**
Use curly braces: `{placeholderName}`

#### **Available Placeholders for PE3:**

```
Basic Information:
{applicantName}              - Full name of applicant
{applicantAddress}           - Address of applicant  
{applicantPostcode}          - Postcode
{vehicleRegistration}        - Vehicle registration number
{penaltyChargeNumber}        - Penalty charge notice number
{dateOfContravention}        - Date when contravention occurred
{locationOfContravention}    - Location where contravention occurred

Respondent Details (CAPS):
{respondentName}             - Respondent name in CAPITAL LETTERS
{respondentAddress}          - Respondent address in CAPITAL LETTERS

Declaration Checkboxes:
{didNotReceiveNotice}        - X if checked, empty if not
{madeRepresentationsNoResponse} - X if checked, empty if not  
{appealedNoResponse}         - X if checked, empty if not

Reasons & Signatures:
{reasonForDeclaration}       - Full text explanation
{signatureDate}              - Date of signature
{currentDate}                - Today's date
{witnessName}                - Witness name
{witnessType}                - Commissioner for Oaths, Solicitor, etc.
{witnessAddress}             - Witness address
```

#### **Available Placeholders for PE2:**

```
Basic Information:
{applicantName}              - Full name of applicant
{applicantAddress}           - Address of applicant
{applicantPostcode}          - Postcode  
{vehicleRegistration}        - Vehicle registration number
{penaltyChargeNumber}        - Penalty charge notice number
{dateOfContravention}        - Date when contravention occurred
{locationOfContravention}    - Location where contravention occurred

Court Details:
{courtName}                  - Name of court/authority
{courtAddress}               - Court address

PE2 Specific:
{reasonsForLateFiling}       - Reasons for filing declaration out of time

Respondent Details (CAPS):
{respondentName}             - Respondent name in CAPITAL LETTERS  
{respondentAddress}          - Respondent address in CAPITAL LETTERS

Signatures:
{signatureDate}              - Date of signature
{currentDate}                - Today's date
{witnessName}                - Witness name
{witnessType}                - Commissioner for Oaths, Solicitor, etc.
{witnessAddress}             - Witness address
```

### Step 3: How to Add Placeholders to Your Word Templates

1. **Open the Word document**
2. **Find form fields** (like name boxes, address fields, etc.)
3. **Replace with placeholders**: Instead of blank lines, type `{applicantName}`, `{vehicleRegistration}`, etc.
4. **For checkboxes**: Replace checkbox areas with `{didNotReceiveNotice}`, etc.
5. **Save the template**

#### Example Template Setup:

**Before (blank form):**
```
Applicant Name: _____________________
Vehicle Registration: _______________
☐ I did not receive the notice
```

**After (with placeholders):**
```
Applicant Name: {applicantName}
Vehicle Registration: {vehicleRegistration}  
{didNotReceiveNotice} I did not receive the notice
```

## 📁 Upload Your Templates Here

```
word_templates/
├── PE2_template.docx    ← Upload your PE2 Word document here
├── PE3_template.docx    ← Upload your PE3 Word document here  
└── README.md            ← This guide
```

## 🔄 How the AI Filling Works

1. **User fills form on website** → AI collects all their information
2. **AI loads your Word template** → Opens PE2_template.docx or PE3_template.docx
3. **AI fills all placeholders** → Replaces {applicantName} with "John Smith", etc.
4. **User downloads completed form** → Professional, court-ready document

## ✅ Current Status

- ✅ **AI Word Filling System:** Ready and working
- ✅ **Template Processing:** Advanced docx-templates library installed
- ✅ **PDF Conversion:** Available (when LibreOffice installed)
- ⏳ **Official Templates:** Waiting for you to upload PE2_template.docx and PE3_template.docx

## 🎉 Benefits

- **100% Accurate:** Uses real government forms
- **Professional:** Court accepts these documents
- **Fast:** AI fills everything automatically
- **Easy Updates:** Government changes form? Just replace template
- **Error-Free:** No manual typing or coordinate guessing

## 🚀 Next Steps

1. **Download official PE2 and PE3 Word documents from gov.uk**
2. **Add placeholders using the format above**
3. **Upload as PE2_template.docx and PE3_template.docx to this folder**
4. **Test the system - AI will automatically fill your templates!**
