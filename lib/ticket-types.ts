// UK Traffic Ticket Type Detection and Validation
// This module handles all types of UK traffic tickets and their formats

export interface TicketType {
  id: string
  name: string
  category: 'civil' | 'criminal' | 'private'
  appealRoute: 'tribunal' | 'court' | 'company'
  forms: string[]
  timeLimit: string
  description: string
  patterns: RegExp[]
  examples: string[]
  fineRange: { min: number; max: number }
  authority: string
}

export const TICKET_TYPES: Record<string, TicketType> = {
  // Penalty Charge Notices (Civil Parking)
  pcn: {
    id: 'pcn',
    name: 'Penalty Charge Notice (PCN)',
    category: 'civil',
    appealRoute: 'tribunal',
    forms: ['Online Appeal', 'Informal Challenge'],
    timeLimit: '28 days from Notice to Owner',
    description: 'Civil parking penalties issued by local authorities',
    patterns: [
      /^PCN[0-9]{6,10}$/i,
      /^LB[0-9]{6,10}$/i,
      /^TK[0-9]{6,10}$/i,
      /^BH[0-9]{6,10}$/i,
      /^[A-Z]{2,3}[0-9]{6,10}$/
    ],
    examples: ['PCN123456789', 'LB12345678', 'TK987654321'],
    fineRange: { min: 25, max: 130 },
    authority: 'Local Authority'
  },

  // Fixed Penalty Notices (Criminal)
  fpn: {
    id: 'fpn',
    name: 'Fixed Penalty Notice (FPN)',
    category: 'criminal',
    appealRoute: 'court',
    forms: ['Court Plea', 'Legal Representation'],
    timeLimit: '28 days from issue',
    description: 'Criminal traffic offenses issued by police',
    patterns: [
      /^FPN[0-9]{6,9}$/i,
      /^HO[0-9]{6,8}$/i,
      /^MP[0-9]{6,8}$/i,
      /^[A-Z]{2,4}[0-9]{6,8}$/
    ],
    examples: ['FPN123456789', 'HO1234567', 'MP12345678'],
    fineRange: { min: 100, max: 1000 },
    authority: 'Police Force'
  },

  // Traffic Enforcement Centre
  tec: {
    id: 'tec',
    name: 'Traffic Enforcement Centre Notice',
    category: 'criminal',
    appealRoute: 'court',
    forms: ['TE7 Appeal', 'TE9 Statutory Declaration', 'Witness Statement'],
    timeLimit: '21 days for TE9, varies for TE7',
    description: 'Unpaid FPNs escalated to magistrates court',
    patterns: [
      /^TEC[0-9]{8,10}$/i,
      /^TE[0-9]{8,10}$/i,
      /^24[0-9]{2}[0-9]{6,8}$/
    ],
    examples: ['TEC1234567890', 'TE9876543210', '2024123456789'],
    fineRange: { min: 150, max: 2000 },
    authority: 'Traffic Enforcement Centre'
  },

  // Speed Camera Notices
  speed_camera: {
    id: 'speed_camera',
    name: 'Speed Camera Notice (NIP)',
    category: 'criminal',
    appealRoute: 'court',
    forms: ['Court Defence', 'Special Reasons', 'Section 1 Request'],
    timeLimit: '28 days from NIP',
    description: 'Notice of Intended Prosecution for speeding',
    patterns: [
      /^NIP[0-9]{6,10}$/i,
      /^NOIP[0-9]{6,10}$/i,
      /^SC[0-9]{6,9}$/i,
      /^CAM[0-9]{6,10}$/i,
      /^SP[0-9]{6,10}$/i
    ],
    examples: ['NIP123456789', 'SC12345678', 'CAM987654321'],
    fineRange: { min: 100, max: 2500 },
    authority: 'Police / Camera Partnership'
  },

  // Bus Lane Violations
  bus_lane: {
    id: 'bus_lane',
    name: 'Bus Lane Violation Notice',
    category: 'civil',
    appealRoute: 'tribunal',
    forms: ['Online Appeal', 'Informal Challenge'],
    timeLimit: '28 days from Notice to Owner',
    description: 'Civil penalty for unauthorized bus lane use',
    patterns: [
      /^BL[0-9]{6,10}$/i,
      /^TFL[0-9]{6,10}$/i,
      /^BUS[0-9]{6,10}$/i
    ],
    examples: ['BL123456789', 'TFL987654321', 'BUS12345678'],
    fineRange: { min: 80, max: 160 },
    authority: 'Local Authority / TfL'
  },

  // Red Light Camera
  red_light: {
    id: 'red_light',
    name: 'Red Light Camera Notice',
    category: 'criminal',
    appealRoute: 'court',
    forms: ['Court Defence', 'Technical Challenge'],
    timeLimit: '28 days from notice',
    description: 'Traffic light violation penalty',
    patterns: [
      /^RLC[0-9]{6,10}$/i,
      /^TL[0-9]{6,10}$/i,
      /^RL[0-9]{6,10}$/i,
      /^TS[0-9]{6,10}$/i
    ],
    examples: ['RLC123456789', 'TL12345678', 'RL987654321'],
    fineRange: { min: 100, max: 1000 },
    authority: 'Police / Local Authority'
  },

  // Congestion Charge
  congestion_charge: {
    id: 'congestion_charge',
    name: 'Congestion Charge Notice',
    category: 'civil',
    appealRoute: 'tribunal',
    forms: ['Online Appeal', 'Representations'],
    timeLimit: '28 days from Notice to Owner',
    description: 'London Congestion Charge penalty',
    patterns: [
      /^CC[0-9]{6,10}$/i,
      /^CCN[0-9]{6,10}$/i,
      /^TFL[0-9]{6,10}$/i
    ],
    examples: ['CC123456789', 'CCN12345678', 'TFL987654321'],
    fineRange: { min: 80, max: 240 },
    authority: 'Transport for London'
  },

  // ULEZ/LEZ
  ulez: {
    id: 'ulez',
    name: 'ULEZ/LEZ Penalty Notice',
    category: 'civil',
    appealRoute: 'tribunal',
    forms: ['Online Appeal', 'Representations'],
    timeLimit: '28 days from Notice to Owner',
    description: 'Ultra Low/Low Emission Zone penalty',
    patterns: [
      /^ULEZ[0-9]{6,10}$/i,
      /^ULZ[0-9]{6,10}$/i,
      /^LEZ[0-9]{6,10}$/i
    ],
    examples: ['ULEZ123456789', 'LEZ12345678', 'ULZ987654321'],
    fineRange: { min: 80, max: 1000 },
    authority: 'Transport for London'
  },

  // School Street
  school_street: {
    id: 'school_street',
    name: 'School Street Violation',
    category: 'civil',
    appealRoute: 'tribunal',
    forms: ['Online Appeal', 'Informal Challenge'],
    timeLimit: '28 days from Notice to Owner',
    description: 'School zone traffic restriction penalty',
    patterns: [
      /^SS[0-9]{6,10}$/i,
      /^SZ[0-9]{6,10}$/i,
      /^SCH[0-9]{6,10}$/i
    ],
    examples: ['SS123456789', 'SZ12345678', 'SCH987654321'],
    fineRange: { min: 65, max: 130 },
    authority: 'Local Authority'
  },

  // Private Parking
  private_parking: {
    id: 'private_parking',
    name: 'Private Parking Notice',
    category: 'private',
    appealRoute: 'company',
    forms: ['POPLA Appeal', 'IAS Appeal', 'Company Appeal'],
    timeLimit: '14 days from Notice to Keeper',
    description: 'Private land parking charge (not a penalty)',
    patterns: [
      /^PPC[0-9]{6,10}$/i,
      /^PKG[0-9]{6,10}$/i,
      /^CP[0-9]{6,10}$/i,
      /^PP[0-9]{6,10}$/i
    ],
    examples: ['PPC123456789', 'PKG12345678', 'CP987654321'],
    fineRange: { min: 60, max: 100 },
    authority: 'Private Parking Company'
  },

  // Generic/Unknown
  unknown: {
    id: 'unknown',
    name: 'Unknown Ticket Type',
    category: 'civil',
    appealRoute: 'court',
    forms: ['General Appeal', 'Legal Advice Required'],
    timeLimit: 'Check notice for specific deadline',
    description: 'Unrecognized ticket format - requires manual review',
    patterns: [/^[A-Z0-9]{6,12}$/i],
    examples: ['ABC123456', 'XYZ987654321'],
    fineRange: { min: 25, max: 2500 },
    authority: 'Various'
  }
}

/**
 * Detect ticket type from ticket number
 */
export function detectTicketType(ticketNumber: string): TicketType {
  const cleanNumber = ticketNumber.trim().toUpperCase()
  
  for (const ticketType of Object.values(TICKET_TYPES)) {
    for (const pattern of ticketType.patterns) {
      if (pattern.test(cleanNumber)) {
        return ticketType
      }
    }
  }
  
  return TICKET_TYPES.unknown
}

/**
 * Validate ticket number format
 */
export function validateTicketNumber(ticketNumber: string): {
  isValid: boolean
  detectedType: TicketType
  suggestions?: string[]
} {
  if (!ticketNumber || ticketNumber.trim().length < 6) {
    return {
      isValid: false,
      detectedType: TICKET_TYPES.unknown,
      suggestions: ['Ticket numbers are usually 6-12 characters long']
    }
  }

  const detectedType = detectTicketType(ticketNumber)
  
  return {
    isValid: detectedType.id !== 'unknown',
    detectedType,
    suggestions: detectedType.id === 'unknown' ? 
      ['Check the ticket number format', 'Look for prefixes like PCN, FPN, TEC, NIP'] : 
      undefined
  }
}

/**
 * Get appeal guidance for ticket type
 */
export function getAppealGuidance(ticketType: TicketType): {
  nextSteps: string[]
  formsRequired: string[]
  timeLimit: string
  appealRoute: string
  costImplications: string
} {
  const guidance = {
    civil: {
      nextSteps: [
        'Make informal challenge within 14 days',
        'If rejected, formal appeal to Traffic Penalty Tribunal within 28 days',
        'Gather evidence (photos, receipts, witness statements)',
        'Submit appeal online with supporting documents'
      ],
      costImplications: 'Free to appeal. No risk of increased penalty.'
    },
    criminal: {
      nextSteps: [
        'Decide between paying fixed penalty or court hearing',
        'If challenging: enter not guilty plea within time limit',
        'Gather evidence and consider legal representation',
        'Prepare defense based on law and procedure'
      ],
      costImplications: 'Risk of higher penalty and costs if unsuccessful at court.'
    },
    private: {
      nextSteps: [
        'Check if company is BPA or IPC member',
        'Appeal to POPLA (BPA) or IAS (IPC) within 14 days',
        'Challenge contract formation and proportionality',
        'Ignore if not a member of recognized scheme'
      ],
      costImplications: 'Free initial appeal. Unenforceable if not scheme member.'
    }
  }

  const categoryGuidance = guidance[ticketType.category]
  
  return {
    nextSteps: categoryGuidance.nextSteps,
    formsRequired: ticketType.forms,
    timeLimit: ticketType.timeLimit,
    appealRoute: `${ticketType.appealRoute} (${ticketType.authority})`,
    costImplications: categoryGuidance.costImplications
  }
}

/**
 * Generate appropriate forms for ticket type
 */
export function getRequiredForms(ticketType: TicketType): string[] {
  switch (ticketType.category) {
    case 'civil':
      return ['Online Appeal Form', 'Evidence Bundle', 'Supporting Documents']
    case 'criminal':
      if (ticketType.id === 'tec') {
        return ['TE7 Appeal Form', 'TE9 Statutory Declaration', 'Witness Statement']
      }
      return ['Court Defence Form', 'Not Guilty Plea', 'Case Summary']
    case 'private':
      return ['POPLA/IAS Appeal', 'Contract Challenge', 'Evidence Package']
    default:
      return ['General Appeal Letter', 'Supporting Evidence']
  }
}

/**
 * Validate ticket number against specific ticket type
 */
export function validateTicketNumberForType(ticketNumber: string, ticketTypeId: string): boolean {
  if (!ticketNumber || ticketNumber.trim().length < 6) {
    return false
  }

  const ticketType = TICKET_TYPES[ticketTypeId]
  if (!ticketType) {
    return false
  }

  const cleanNumber = ticketNumber.trim().toUpperCase()
  
  for (const pattern of ticketType.patterns) {
    if (pattern.test(cleanNumber)) {
      return true
    }
  }
  
  return false
}
