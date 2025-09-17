# UK Traffic Ticket Number Formats and Types

This file defines the different types of traffic tickets and their number formats for the AI system.

## Ticket Types and Number Formats

### 1. Penalty Charge Notices (PCNs) - Parking
- **Format**: Various formats depending on issuing authority
- **Examples**: 
  - `PCN123456789` (Generic)
  - `LB123456` (London Borough)
  - `TK1234567890` (Transport for London)
  - `BH12345678` (Borough specific)
- **Length**: 8-12 characters
- **Prefix**: Often PCN, LB, TK, BH, or authority code

### 2. Fixed Penalty Notices (FPNs) - Police Issued
- **Format**: Typically alphanumeric with specific patterns
- **Examples**:
  - `FPN123456789` (Generic FPN)
  - `HO123456` (Home Office code + number)
  - `MP1234567` (Metropolitan Police)
  - `WMP123456` (West Midlands Police)
- **Length**: 8-10 characters
- **Usage**: Speeding, traffic lights, moving violations

### 3. Traffic Enforcement Centre (TEC) Numbers
- **Format**: Unique reference numbers for magistrates court fines
- **Examples**:
  - `TEC1234567890` (Traffic Enforcement Centre)
  - `TE1234567890` (Short form)
  - `2412345678` (Numeric only - year prefix)
- **Length**: 10-12 characters
- **Usage**: Unpaid FPNs escalated to court

### 4. Speed Camera Notices (NOIP/NIP)
- **Format**: Notice of Intended Prosecution numbers
- **Examples**:
  - `NIP123456789` (Notice of Intended Prosecution)
  - `NOIP12345678` (Notice of Intended Prosecution)
  - `SC1234567` (Speed Camera reference)
  - `CAM123456789` (Camera system reference)
- **Length**: 8-12 characters

### 5. Bus Lane Violation Notices
- **Format**: Similar to PCNs but specific to bus lanes
- **Examples**:
  - `BL123456789` (Bus Lane)
  - `TFL123456789` (Transport for London)
  - `BUS12345678` (Generic bus lane)
- **Length**: 8-12 characters

### 6. Red Light Camera Notices
- **Format**: Traffic light violation references
- **Examples**:
  - `RLC123456789` (Red Light Camera)
  - `TL1234567890` (Traffic Light)
  - `RL123456789` (Red Light)
- **Length**: 8-12 characters

### 7. Congestion Charge Notices
- **Format**: London Congestion Charge specific
- **Examples**:
  - `CC123456789` (Congestion Charge)
  - `CCN12345678` (Congestion Charge Notice)
  - `TFL123456789` (Transport for London)
- **Length**: 8-12 characters

### 8. ULEZ (Ultra Low Emission Zone) Notices
- **Format**: Environmental zone violation notices
- **Examples**:
  - `ULEZ123456789`
  - `ULZ12345678`
  - `LEZ123456789` (Low Emission Zone)
- **Length**: 8-12 characters

### 9. School Street Violations
- **Format**: School zone traffic restrictions
- **Examples**:
  - `SS123456789` (School Street)
  - `SZ1234567890` (School Zone)
- **Length**: 8-12 characters

### 10. Private Parking Notices
- **Format**: Private parking company issued
- **Examples**:
  - `PPC123456789` (Private Parking Company)
  - `PKG12345678` (Parking notice)
  - `CP1234567890` (Car Park)
- **Length**: 8-12 characters
- **Note**: These are invoices, not penalty charge notices

## Validation Patterns

```regex
# PCN Patterns
^(PCN|LB|TK|BH|[A-Z]{2,3})[0-9]{6,10}$

# FPN Patterns  
^(FPN|HO|MP|[A-Z]{2,4})[0-9]{6,8}$

# TEC Patterns
^(TEC|TE|24[0-9]{2})[0-9]{8,10}$

# Speed Camera Patterns
^(NIP|NOIP|SC|CAM)[0-9]{6,10}$

# Bus Lane Patterns
^(BL|TFL|BUS)[0-9]{6,10}$

# Red Light Patterns
^(RLC|TL|RL)[0-9]{6,10}$

# Congestion Charge Patterns
^(CC|CCN|TFL)[0-9]{6,10}$

# ULEZ Patterns
^(ULEZ|ULZ|LEZ)[0-9]{6,10}$

# School Street Patterns
^(SS|SZ)[0-9]{6,10}$

# Private Parking Patterns
^(PPC|PKG|CP)[0-9]{6,10}$
```

## Appeal Routes by Ticket Type

### Civil Penalties (PCNs)
- **Route**: Traffic Penalty Tribunal
- **Time Limit**: 28 days from Notice to Owner
- **Forms**: Not TE7/TE9 - online appeal system

### Criminal Penalties (FPNs)
- **Route**: Magistrates Court or pay fixed penalty
- **Time Limit**: 28 days from issue
- **Forms**: Court plea or payment

### TEC Enforcement
- **Route**: Statutory Declaration (TE9) or Appeal (TE7)
- **Time Limit**: 21 days for TE9, varies for TE7
- **Forms**: TE7, TE9, Witness Statement

### Speed Camera/Police Notices
- **Route**: Court hearing or fixed penalty
- **Time Limit**: 28 days from NIP
- **Forms**: Court forms if challenging

## AI System Integration

The AI should:
1. **Identify ticket type** from number format
2. **Determine correct appeal route** based on type
3. **Use appropriate forms** (TE7/TE9 for TEC, online for PCNs)
4. **Provide correct time limits** for each type
5. **Generate appropriate appeal letters** for the jurisdiction

## Common Mistakes to Avoid

- **TE7/TE9 forms** are ONLY for Traffic Enforcement Centre cases
- **PCNs** use Traffic Penalty Tribunal, not TE forms
- **Private parking** notices are not penalty charge notices
- **Time limits vary** significantly between types
- **Appeal routes differ** - some go to court, others to tribunals
