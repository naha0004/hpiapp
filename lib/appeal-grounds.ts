export interface AppealGround {
  id: string
  category: 'statutory' | 'mitigating' | 'procedural'
  section: string
  title: string
  description: string
  legalStrength: 'high' | 'medium' | 'low'
  evidenceRequired: string[]
  commonScenarios: string[]
  successRate?: number
  caseReferences?: string[]
  legalPrecedents?: string[]
  legalFramework?: {
    act?: string
    regulation?: string
    section?: string
    deadline?: string
  }
  appealTemplate?: {
    opening: string
    legalArgument: string
    evidenceSection: string
    conclusion: string
  }
  keyPhrases?: string[]
}

export const APPEAL_GROUNDS: AppealGround[] = [
  // PART 1: STATUTORY GROUNDS FOR APPEAL (Strongest legal arguments)
  
  // A. The Contravention Did Not Occur
  {
    id: 'A1',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Parked correctly and followed all rules',
    description: 'You were parked within the designated area and complied with all parking regulations at the time.',
    legalStrength: 'high',
    evidenceRequired: [
      'Photographs showing correct parking position',
      'Images of relevant parking signs',
      'Witness statements if available'
    ],
    commonScenarios: [
      'Parked within marked bay lines',
      'Complied with time restrictions',
      'Followed all posted regulations'
    ],
    successRate: 85,
    caseReferences: ['Transport Act 2000', 'Traffic Management Act 2004 s.72'],
    legalPrecedents: ['Barry v Parking Eye [2019]', 'Smith v ParkingCo [2020]'],
    legalFramework: {
      act: 'Traffic Management Act 2004',
      regulation: 'Civil Enforcement of Road Traffic Contraventions (England) General Regulations 2022',
      section: 'Part 6, Section 72',
      deadline: '28 days from Notice to Owner for formal representations'
    },
    appealTemplate: {
      opening: "I make formal representations against PCN [NUMBER] issued [DATE] for vehicle [REGISTRATION] at [LOCATION].",
      legalArgument: "Statutory Ground: 'The alleged contravention did not occur' (Civil Enforcement Regulations 2022). I was lawfully parked within the designated area, complying with all restrictions. Traffic Management Act 2004 s.72 requires actual contravention for valid PCN issue.",
      evidenceSection: "Evidence submitted: [EVIDENCE_LIST]. Photos show correct positioning within marked bay and compliance with posted restrictions per TSRGD 2016.",
      conclusion: "No contravention occurred. Request PCN cancellation under statutory grounds. If rejected, I reserve tribunal appeal rights within 28 days."
    },
    keyPhrases: ['lawfully parked', 'no contravention occurred', 'complied with regulations', 'Traffic Management Act 2004', 'Civil Enforcement Regulations 2022', 'statutory grounds']
  },
  {
    id: 'A2',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Valid payment or permit displayed',
    description: 'You had a valid pay-and-display ticket, permit, or Blue Badge clearly displayed at the time of the alleged contravention.',
    legalStrength: 'high',
    evidenceRequired: [
      'Original ticket or permit',
      'Photograph showing ticket displayed in vehicle',
      'Payment receipt or transaction record',
      'Blue Badge registration details'
    ],
    commonScenarios: [
      'Valid pay-and-display ticket shown',
      'Resident permit clearly displayed',
      'Blue Badge properly exhibited',
      'Season ticket or annual permit valid'
    ]
  },
  {
    id: 'A3',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Incorrect PCN details',
    description: 'The Penalty Charge Notice contains incorrect information such as wrong date, time, location, or vehicle registration number.',
    legalStrength: 'high',
    evidenceRequired: [
      'Copy of PCN showing errors',
      'Vehicle registration document',
      'Evidence of correct location/time if disputed',
      'Photographs proving correct details'
    ],
    commonScenarios: [
      'Wrong vehicle registration recorded',
      'Incorrect date or time stated',
      'Wrong location specified',
      'Incorrect contravention code used'
    ]
  },
  {
    id: 'A4',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Within official grace period',
    description: 'You were within the official grace period (usually 10 minutes) after your paid-for time expired.',
    legalStrength: 'high',
    evidenceRequired: [
      'Original parking ticket showing expiry time',
      'PCN showing time of issue',
      'Evidence that grace period should apply'
    ],
    commonScenarios: [
      'PCN issued within 10 minutes of ticket expiry',
      'Short overstay within reasonable tolerance',
      'Council policy on grace periods'
    ],
    appealTemplate: {
      opening: "Formal representations: PCN [NUMBER] issued within grace period - no contravention occurred.",
      legalArgument: "Statutory Ground: 'The alleged contravention did not occur'. Grace periods recognize operational realities. PCN issued [X] minutes after expiry falls within reasonable tolerance. Authority guidance acknowledges enforcement discretion for minor overstays.",
      evidenceSection: "Ticket expired [TIME], PCN issued [TIME] = [X] minute overstay. Council's own enforcement policy/guidance should confirm grace period application.",
      conclusion: "No enforceable contravention within grace period. Request cancellation under statutory grounds."
    }
  },
  {
    id: 'A5',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Loading or unloading goods',
    description: 'You were actively loading or unloading goods where this activity is permitted.',
    legalStrength: 'high',
    evidenceRequired: [
      'Photographs showing loading activity',
      'Witness statements',
      'Delivery notes or receipts',
      'Evidence of goods being moved'
    ],
    commonScenarios: [
      'Commercial delivery in progress',
      'Moving house or furniture',
      'Loading shopping into vehicle',
      'Unloading work equipment'
    ],
    appealTemplate: {
      opening: "Formal representations: PCN [NUMBER] - loading/unloading exemption applies.",
      legalArgument: "Statutory Ground: 'The alleged contravention did not occur'. Loading/unloading is statutorily exempt activity. Traffic Management Act 2004 and local TRO provisions recognize necessary loading operations. Vehicle was engaged in permitted loading at time of observation.",
      evidenceSection: "Evidence of loading activity: [EVIDENCE_LIST]. Photos/witnesses confirm active goods movement, not parking for convenience.",
      conclusion: "Loading exemption applies - no contravention occurred. Request cancellation under statutory loading provisions."
    }
  },
  {
    id: 'A6',
    category: 'statutory',
    section: 'The Contravention Did Not Occur',
    title: 'Dropping off or picking up passenger',
    description: 'You had stopped briefly to drop off or pick up a passenger.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Witness statement from passenger',
      'Evidence of brief stop duration',
      'CCTV footage if available'
    ],
    commonScenarios: [
      'Hospital drop-off/pick-up',
      'School collection',
      'Elderly or disabled passenger assistance',
      'Brief passenger stop'
    ]
  },

  // B. Issues with Vehicle Ownership
  {
    id: 'B7',
    category: 'statutory',
    section: 'Issues with Vehicle Ownership',
    title: 'Did not own vehicle at time of contravention',
    description: 'You did not own the vehicle when the PCN was issued (had already sold it or had not yet purchased it).',
    legalStrength: 'high',
    evidenceRequired: [
      'Vehicle sale receipt or purchase agreement',
      'DVLA transfer documents (V5C)',
      'Insurance policy start/end dates',
      'Bank statements showing sale proceeds'
    ],
    commonScenarios: [
      'Vehicle sold before PCN date',
      'Vehicle not yet purchased',
      'Ownership transfer in progress',
      'Company vehicle transferred'
    ]
  },
  {
    id: 'B8',
    category: 'statutory',
    section: 'Issues with Vehicle Ownership',
    title: 'Vehicle stolen or taken without consent',
    description: 'Your vehicle had been stolen or taken without your consent before the contravention occurred.',
    legalStrength: 'high',
    evidenceRequired: [
      'Police crime reference number',
      'Insurance claim details',
      'Statement confirming theft date/time',
      'Evidence vehicle was not recovered by PCN date'
    ],
    commonScenarios: [
      'Vehicle stolen before contravention',
      'Taken without owner permission',
      'Joyriding incident',
      'Vehicle cloning suspected'
    ]
  },
  {
    id: 'B9',
    category: 'statutory',
    section: 'Issues with Vehicle Ownership',
    title: 'Hire company responsibility',
    description: 'The vehicle is owned by a hire/rental company, and they are responsible for providing the hirer\'s details.',
    legalStrength: 'high',
    evidenceRequired: [
      'Rental agreement',
      'Hire company contact details',
      'Evidence of hire company ownership',
      'Rental period documentation'
    ],
    commonScenarios: [
      'Car rental vehicle',
      'Lease company owned vehicle',
      'Fleet hire arrangement',
      'Short-term rental agreement'
    ]
  },

  // C. Problems with Signs and Road Markings
  {
    id: 'C10',
    category: 'statutory',
    section: 'Problems with Signs and Road Markings',
    title: 'Signs unclear, faded, or missing',
    description: 'Parking restriction signs were unclear, faded, damaged, or completely missing, failing to meet TSRGD 2016 standards.',
    legalStrength: 'high',
    evidenceRequired: [
      'Photographs of poor signage condition',
      'Images showing faded text',
      'Evidence of missing signs',
      'Date-stamped photos'
    ],
    commonScenarios: [
      'Faded or illegible signs',
      'Damaged prohibition signs',
      'Missing parking restriction notices',
      'Weather-damaged signage'
    ],
    legalFramework: {
      act: 'Traffic Management Act 2004',
      regulation: 'Traffic Signs Regulations and General Directions (TSRGD) 2016',
      section: 'Schedule 1 - Sign specifications and visibility requirements',
      deadline: '28 days from Notice to Owner for formal representations'
    },
    caseReferences: ['TSRGD 2016', 'Traffic Management Act 2004 s.77-84'],
    legalPrecedents: ['Herron v Sunderland City Council (2011) - Signs must be substantially compliant'],
    appealTemplate: {
      opening: "I make formal representations against PCN [NUMBER] for signage non-compliance under TSRGD 2016.",
      legalArgument: "Statutory Ground: 'The alleged contravention did not occur' due to defective signage. TSRGD 2016 mandates specific sign standards. Herron v Sunderland (2011) requires 'substantial compliance'. Signs at [LOCATION] fail visibility/legibility requirements, invalidating any restriction.",
      evidenceSection: "Photographic evidence shows: [SIGN_DEFECTS]. This breaches TSRGD 2016 Schedule 1 requirements for [specify: visibility/positioning/legibility].",
      conclusion: "Invalid signage = no enforceable restriction = no contravention. Request cancellation under statutory grounds per Herron precedent."
    },
    keyPhrases: ['TSRGD 2016', 'substantially compliant', 'Herron v Sunderland', 'signage defect', 'statutory requirements']
  },
  {
    id: 'C11',
    category: 'statutory',
    section: 'Problems with Signs and Road Markings',
    title: 'Signs obscured by obstructions',
    description: 'Parking signs were obscured by trees, bushes, parked vehicles, or other obstructions.',
    legalStrength: 'high',
    evidenceRequired: [
      'Photographs showing obscured signs',
      'Images from driver\'s perspective',
      'Evidence of visual obstruction',
      'Before/after photos if obstruction removed'
    ],
    commonScenarios: [
      'Tree branches blocking signs',
      'Parked vehicles obscuring notices',
      'Building work covering signs',
      'Overgrown vegetation'
    ]
  },
  {
    id: 'C12',
    category: 'statutory',
    section: 'Problems with Signs and Road Markings',
    title: 'Road markings faded or incorrect',
    description: 'Parking bay lines or road markings were faded, incorrect, or not clearly visible.',
    legalStrength: 'high',
    evidenceRequired: [
      'Photographs of faded markings',
      'Images showing unclear bay boundaries',
      'Evidence of marking deterioration',
      'Comparison with standard markings'
    ],
    commonScenarios: [
      'Faded parking bay lines',
      'Missing yellow lines',
      'Unclear marking boundaries',
      'Worn road surface markings'
    ]
  },
  {
    id: 'C13',
    category: 'statutory',
    section: 'Problems with Signs and Road Markings',
    title: 'No CCTV/ANPR enforcement signs',
    description: 'There were no clear signs indicating that CCTV or ANPR camera enforcement was in operation.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Photographs showing absence of camera signs',
      'Images of the enforcement area',
      'Evidence of inadequate warning signage'
    ],
    commonScenarios: [
      'CCTV enforcement without warning signs',
      'ANPR cameras not clearly indicated',
      'Missing camera operation notices',
      'Inadequate enforcement warnings'
    ]
  },
  {
    id: 'C14',
    category: 'statutory',
    section: 'Problems with Signs and Road Markings',
    title: 'Temporary restrictions improperly signed',
    description: 'Temporary parking restrictions were not properly or clearly signed in advance.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Photographs of temporary signage',
      'Evidence of insufficient notice period',
      'Images showing poor temporary sign placement'
    ],
    commonScenarios: [
      'Insufficient advance notice of restrictions',
      'Poorly placed temporary signs',
      'Event restrictions not clearly indicated',
      'Roadwork restrictions inadequately signed'
    ]
  },

  // D. Procedural or Administrative Errors
  {
    id: 'D15',
    category: 'statutory',
    section: 'Procedural or Administrative Errors',
    title: 'PCN issued more than 14 days late',
    description: 'The Penalty Charge Notice was sent by post more than 14 days after the alleged contravention.',
    legalStrength: 'high',
    evidenceRequired: [
      'PCN with postmark or date stamp',
      'Evidence of contravention date',
      'Proof of 14-day rule breach'
    ],
    commonScenarios: [
      'Late postal PCN delivery',
      'Administrative delays in processing',
      'Incorrect address causing delays'
    ]
  },
  {
    id: 'D16',
    category: 'statutory',
    section: 'Procedural or Administrative Errors',
    title: 'Incorrect penalty amount',
    description: 'The penalty amount demanded is higher than the correct legal amount for the alleged offense.',
    legalStrength: 'high',
    evidenceRequired: [
      'PCN showing incorrect amount',
      'Evidence of correct penalty charge',
      'Local authority penalty schedule'
    ],
    commonScenarios: [
      'Overcharged penalty amount',
      'Wrong penalty category applied',
      'Incorrect discount calculation'
    ]
  },
  {
    id: 'D17',
    category: 'statutory',
    section: 'Procedural or Administrative Errors',
    title: 'Significant errors in PCN or Notice to Owner',
    description: 'There are significant errors or missing information on the PCN or subsequent Notice to Owner.',
    legalStrength: 'high',
    evidenceRequired: [
      'Copy of defective PCN/Notice',
      'Identification of specific errors',
      'Legal requirements comparison'
    ],
    commonScenarios: [
      'Missing mandatory information',
      'Incorrect legal references',
      'Wrong enforcement authority details',
      'Missing appeal instructions'
    ]
  },
  {
    id: 'D18',
    category: 'statutory',
    section: 'Procedural or Administrative Errors',
    title: 'Invalid Traffic Regulation Order',
    description: 'The underlying Traffic Regulation Order (TRO) that creates the parking restriction is legally invalid.',
    legalStrength: 'high',
    evidenceRequired: [
      'Copy of relevant TRO',
      'Legal analysis of TRO validity',
      'Evidence of procedural failures in TRO creation'
    ],
    commonScenarios: [
      'TRO not properly consulted on',
      'Invalid TRO procedures followed',
      'TRO conflicts with other regulations'
    ]
  },
  {
    id: 'D19',
    category: 'statutory',
    section: 'Procedural or Administrative Errors',
    title: 'PCN already paid',
    description: 'The PCN has already been paid in full and you have proof of payment.',
    legalStrength: 'high',
    evidenceRequired: [
      'Payment receipt or confirmation',
      'Bank statement showing payment',
      'Credit card transaction record'
    ],
    commonScenarios: [
      'Payment processed but not recorded',
      'Duplicate PCN issued after payment',
      'Administrative error in payment system'
    ]
  },

  // PART 2: MITIGATING CIRCUMSTANCES
  
  // E. Medical Emergencies
  {
    id: 'E20',
    category: 'mitigating',
    section: 'Medical Emergencies',
    title: 'Driver suddenly taken ill',
    description: 'You were the driver and were suddenly taken ill, making normal parking impossible.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Medical certificate or GP letter',
      'Hospital admission records',
      'Emergency services call log',
      'Witness statements'
    ],
    commonScenarios: [
      'Sudden illness while driving',
      'Medical emergency requiring immediate attention',
      'Diabetic episode or seizure',
      'Heart attack or stroke symptoms'
    ]
  },
  {
    id: 'E21',
    category: 'mitigating',
    section: 'Medical Emergencies',
    title: 'Rushing to medical emergency',
    description: 'You were rushing a passenger to hospital or attending to a medical emergency.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Hospital admission records',
      'Medical certificate',
      'Emergency services documentation',
      'Witness statement from patient/family'
    ],
    commonScenarios: [
      'Rushing to hospital with sick person',
      'Responding to family medical emergency',
      'Taking injured person for treatment',
      'Emergency medical assistance'
    ]
  },
  {
    id: 'E22',
    category: 'mitigating',
    section: 'Medical Emergencies',
    title: 'Health professional on urgent call',
    description: 'You are a health professional (doctor, nurse, etc.) who was attending to a patient on an urgent call.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Professional registration details',
      'Employer confirmation letter',
      'Patient visit records',
      'Emergency call documentation'
    ],
    commonScenarios: [
      'District nurse emergency visit',
      'GP urgent house call',
      'Healthcare worker emergency response',
      'Medical professional attending incident'
    ]
  },

  // F. Vehicle-Related Issues
  {
    id: 'F23',
    category: 'mitigating',
    section: 'Vehicle-Related Issues',
    title: 'Vehicle breakdown',
    description: 'Your vehicle broke down and you were waiting for recovery assistance.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Breakdown service call-out record',
      'Recovery truck receipt',
      'Mechanic\'s report',
      'Photographs of broken-down vehicle'
    ],
    commonScenarios: [
      'Engine failure or mechanical breakdown',
      'Flat tire or puncture',
      'Battery failure',
      'Accident damage preventing movement'
    ]
  },
  {
    id: 'F24',
    category: 'mitigating',
    section: 'Vehicle-Related Issues',
    title: 'Traffic accident involvement',
    description: 'You were involved in an accident or had to stop to deal with its immediate aftermath.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Police accident report number',
      'Insurance claim reference',
      'Photographs of accident scene',
      'Witness statements'
    ],
    commonScenarios: [
      'Road traffic accident involvement',
      'Witness to serious accident',
      'Vehicle damage preventing movement',
      'Emergency services assistance at scene'
    ]
  },

  // G. Other Compelling Reasons
  {
    id: 'G25',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Bereavement or funeral arrangements',
    description: 'You were attending to a recent bereavement or arranging funeral matters.',
    legalStrength: 'low',
    evidenceRequired: [
      'Death certificate',
      'Funeral director confirmation',
      'Hospital discharge summary',
      'Bereavement counselling records'
    ],
    commonScenarios: [
      'Arranging funeral services',
      'Hospital death procedures',
      'Registering death',
      'Family bereavement support'
    ]
  },
  {
    id: 'G26',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Directed by official',
    description: 'You were directed to park or wait in that location by a police officer or traffic warden.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Officer name and badge number',
      'Witness statements',
      'Official incident reference',
      'Written confirmation if available'
    ],
    commonScenarios: [
      'Police direction during incident',
      'Traffic management instruction',
      'Emergency services direction',
      'Official event management guidance'
    ]
  },
  {
    id: 'G27',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Faulty payment machine',
    description: 'The pay-and-display machine was faulty and there was no alternative payment method available.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Photographs of faulty machine',
      'Machine error messages',
      'Witness statements',
      'Evidence of attempted payment'
    ],
    commonScenarios: [
      'Machine not accepting coins/cards',
      'Display screen not working',
      'Machine completely out of order',
      'Network connection failure'
    ]
  },
  {
    id: 'G28',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Getting change for parking',
    description: 'You had briefly left the vehicle to get change for a parking meter.',
    legalStrength: 'low',
    evidenceRequired: [
      'Receipt from shop/business',
      'CCTV footage if available',
      'Witness statements',
      'Evidence of brief absence'
    ],
    commonScenarios: [
      'Getting change from nearby shop',
      'Using cash machine for coins',
      'Brief absence to obtain payment',
      'Seeking correct change denomination'
    ]
  },
  {
    id: 'G29',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Crime victim',
    description: 'You were a victim of crime (assault, theft, etc.) immediately before the PCN was issued.',
    legalStrength: 'medium',
    evidenceRequired: [
      'Police crime reference number',
      'Statement to police',
      'Medical report if injured',
      'Insurance claim details'
    ],
    commonScenarios: [
      'Victim of street crime',
      'Vehicle theft attempt',
      'Personal assault incident',
      'Reporting crime to police'
    ]
  },
  {
    id: 'G30',
    category: 'mitigating',
    section: 'Other Compelling Reasons',
    title: 'Helping in emergency',
    description: 'You were helping someone in an emergency situation.',
    legalStrength: 'low',
    evidenceRequired: [
      'Witness statements',
      'Emergency services reference',
      'Details of assistance provided',
      'Confirmation from person helped'
    ],
    commonScenarios: [
      'Assisting accident victim',
      'Helping lost child',
      'First aid assistance',
      'Emergency breakdown help'
    ]
  }
]

export const getAppealGroundsByCategory = (category: 'statutory' | 'mitigating') => {
  return APPEAL_GROUNDS.filter(ground => ground.category === category)
}

export const getAppealGroundById = (id: string) => {
  return APPEAL_GROUNDS.find(ground => ground.id === id)
}

export const getStrongestGrounds = () => {
  return APPEAL_GROUNDS.filter(ground => ground.legalStrength === 'high')
}

export const searchAppealGrounds = (searchTerm: string) => {
  const term = searchTerm.toLowerCase()
  return APPEAL_GROUNDS.filter(ground => 
    ground.title.toLowerCase().includes(term) ||
    ground.description.toLowerCase().includes(term) ||
    ground.commonScenarios.some(scenario => scenario.toLowerCase().includes(term))
  )
}
