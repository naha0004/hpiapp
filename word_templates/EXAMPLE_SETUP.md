## Example Template Setup

This is an example of how to set up your PE3 Word template with placeholders.

### Sample PE3 Template Content:

```
PE3 - STATUTORY DECLARATION
Unpaid penalty charge

I declare that:

{didNotReceiveNotice} I did not receive the Notice to Owner/Enforcement Notice/Penalty Charge Notice
{madeRepresentationsNoResponse} I made representations but did not receive a rejection notice  
{appealedNoResponse} I appealed to the Parking/Traffic Adjudicator but received no response

PENALTY CHARGE DETAILS
Penalty Charge Notice Number: {penaltyChargeNumber}
Vehicle Registration Mark: {vehicleRegistration}
Date of Contravention: {dateOfContravention}
Location of Contravention: {locationOfContravention}

APPLICANT DETAILS
Full Name: {applicantName}
Address: {applicantAddress}
Postcode: {applicantPostcode}

RESPONDENT DETAILS (BLOCK CAPITALS)
Full Name: {respondentName}
Address: {respondentAddress}

REASONS FOR DECLARATION
{reasonForDeclaration}

DECLARATION
I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

I believe that the facts stated in this declaration are true.

Signature: ____________________________
Date: {signatureDate}

WITNESS DETAILS
Witness Name: {witnessName}
Witness Type: {witnessType}
Witness Address: {witnessAddress}
```

### How the AI Will Fill This:

When a user enters:
- Name: "John Smith"
- Vehicle: "AB12 CDE"  
- Didn't receive notice: ✓ (checked)
- Other options: ☐ (unchecked)
- Reasons: "I was abroad and never received any notices..."

The AI will output:
```
PE3 - STATUTORY DECLARATION
Unpaid penalty charge

I declare that:

X I did not receive the Notice to Owner/Enforcement Notice/Penalty Charge Notice
  I made representations but did not receive a rejection notice
  I appealed to the Parking/Traffic Adjudicator but received no response

PENALTY CHARGE DETAILS
Penalty Charge Notice Number: PC123456789
Vehicle Registration Mark: AB12 CDE
Date of Contravention: 15/01/2024
Location of Contravention: High Street, London

APPLICANT DETAILS
Full Name: John Smith
Address: 123 Test Street, London
Postcode: SW1A 1AA

RESPONDENT DETAILS (BLOCK CAPITALS)
Full Name: LONDON BOROUGH COUNCIL
Address: CIVIC CENTRE, HIGH STREET, LONDON SW1A 1AA

REASONS FOR DECLARATION
I was abroad on business during the entire period when these notices were allegedly sent. I have flight records and hotel receipts proving I was in Spain from January 10th to February 5th, 2024. Upon my return, I found no notices at my registered address. The first notification I received was the enforcement action letter...

[AI continues with professional legal language]

DECLARATION
I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

I believe that the facts stated in this declaration are true.

Signature: ____________________________
Date: 21/09/2024

WITNESS DETAILS
Witness Name: Jane Doe
Witness Type: Commissioner for Oaths
Witness Address: 456 Legal Street, London
```

This creates a professional, court-ready document automatically!
