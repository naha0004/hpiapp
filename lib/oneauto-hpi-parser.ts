/**
 * OneAuto HPI API Response Parser
 * Handles the comprehensive HPI check data structure from OneAuto sandbox API
 */

export interface OneAutoHPIResponse {
  success: boolean
  result?: {
    date_last_updated: string
    vehicle_registration_mark: string
    does_vehicle_identification_number_match: boolean
    dvla_manufacturer_desc: string
    dvla_model_desc: string
    dvla_fuel_desc: string
    dvla_body_desc: string
    dvla_doorplan_code: number
    dvla_transmission_code: string
    dvla_transmission_desc: string
    number_gears: number
    mvris_manufacturer_code: string
    mvris_model_code: string
    dvla_dtp_manufacturer_code: string
    dvla_dtp_model_code: number
    number_seats: number
    dvla_wheelplan: string
    registration_date: string
    manufactured_year: number
    vehicle_identification_number: string
    first_registration_date: string
    used_before_first_registration: boolean
    co2_gkm: number
    engine_capacity_cc: number
    engine_number: string
    is_scrapped: boolean
    scrapped_date: string | null
    is_exported: boolean
    exported_date: string | null
    is_imported: boolean
    is_non_eu_import: boolean
    prior_gb_vrm: string | null
    prior_ni_vrm: string | null
    colour: string
    maximum_permissable_mass_kg: number
    power_weight_ratio_kw_kg: number
    min_kerbweight_kg: number
    gross_vehicleweight_kg: number
    max_netpower_kw: number
    max_braked_towing_weight_kg: number
    max_unbraked_towing_weight_kg: number
    stationary_soundlevel_db: number
    stationary_soundlevel_rpm: number
    driveby_soundlevel_db: number
    v5c_data_qty: number
    v5c_data_items: Array<{
      date_v5c_issued: string
    }>
    vehicle_identity_check_qty: number
    vehicle_identity_check_items: Array<{
      date_of_vehicle_identity_check: string
      result_of_vehicle_identity_check: string
    }>
    keeper_changes_qty: number
    keeper_data_items: Array<{
      date_last_updated: string
      number_previous_keepers: number
      date_of_last_keeper_change: string
    }>
    colour_changes_qty: number
    colour_data_items: Array<{
      date_last_updated: string
      number_previous_colours: number
      date_of_last_colour_change: string
      last_colour: string
    }>
    finance_data_qty: number
    finance_data_items: Array<{
      date_last_updated: string
      finance_start_date: string
      finance_term_months: number
      finance_type: string
      finance_company: string
      finance_company_contact_number: string
      finance_agreement_number: number
      financed_vehicle_desc: string
    }>
    cherished_data_qty: number
    cherished_data_items: Array<{
      cherished_plate_transfer_date: string
      previous_vehicle_registration_mark: string
      date_of_receipt: string
      transfer_type: string
      current_vehicle_registration_mark: string
    }>
    condition_data_qty: number
    condition_data_items: Array<{
      date_last_updated: string
      date_of_loss: string
      vehicle_status: string
      theft_indictor_literal: string
      date_of_miaftr_entry: string
      insurer_name: string
      insurer_contact_number: string
      insurer_claim_number: string
      loss_type: string
      insurer_make: string
      insurer_model: string
      insurer_code: string
      insurer_branch: number
      theft_indicator: string
      date_removed: string
    }>
    stolen_vehicle_data_qty: number
    stolen_vehicle_data_items: Array<{
      date_last_updated: string
      date_reported: string
      is_stolen: boolean
      police_force: string
      police_force_contact_number: string
    }>
    high_risk_data_qty: number
    high_risk_data_items: Array<{
      date_last_updated: string
      date_of_interest: string
      registration_period: number
      high_risk_type: string
      extra_information: string
      company_name: string
      company_contact_number: string
      company_contact_reference: string
    }>
    previous_search_qty: number
    previous_search_items: Array<{
      date_of_search: string
      time_of_search: string
      business_type_searching: string
    }>
    indemnity_months: number
    indemnity_gbp: number
  }
  error?: string
}

export interface ParsedHPIData {
  // Basic vehicle information
  vehicleInfo: {
    registration: string
    vin: string
    vinMatch: boolean
    make: string
    model: string
    colour: string
    fuelType: string
    bodyType: string
    transmission: string
    gears: number
    seats: number
    engineCapacity: number
    engineNumber: string
    co2Emissions: number
    manufacturedYear: number
    registrationDate: string
    firstRegistrationDate: string
    usedBeforeFirstReg: boolean
  }

  // Legal and administrative status
  legalStatus: {
    isScrapped: boolean
    scrappedDate: string | null
    isExported: boolean
    exportedDate: string | null
    isImported: boolean
    isNonEuImport: boolean
    priorGbVrm: string | null
    priorNiVrm: string | null
  }

  // Technical specifications
  technicalSpecs: {
    wheelplan: string
    maxPermissableMass: number
    powerWeightRatio: number
    minKerbWeight: number
    grossVehicleWeight: number
    maxNetPower: number
    maxBrakedTowingWeight: number
    maxUnbrakedTowingWeight: number
    stationarySoundLevel: number
    stationarySoundRpm: number
    driveBySoundLevel: number
  }

  // Document history
  documentHistory: {
    v5cIssued: Array<{
      dateIssued: string
    }>
    identityChecks: Array<{
      date: string
      result: string
    }>
  }

  // Ownership history
  ownershipHistory: {
    numberOfPreviousKeepers: number
    lastKeeperChangeDate: string
    colourChanges: {
      numberOfPreviousColours: number
      lastColourChangeDate: string
      lastColour: string
    }
  }

  // Finance information
  financeHistory: {
    hasOutstandingFinance: boolean
    financeAgreements: Array<{
      startDate: string
      termMonths: number
      type: string
      company: string
      contactNumber: string
      agreementNumber: number
      vehicleDescription: string
    }>
  }

  // Cherished transfer history
  cherishedTransfers: Array<{
    transferDate: string
    previousVrm: string
    receiptDate: string
    transferType: string
    currentVrm: string
  }>

  // Insurance and theft data
  conditionData: {
    hasInsuranceClaims: boolean
    isStolen: boolean
    claims: Array<{
      dateOfLoss: string
      status: string
      theftIndicator: string
      insurerName: string
      insurerContact: string
      claimNumber: string
      lossType: string
      dateRemoved: string | null
    }>
    stolenVehicleReports: Array<{
      dateReported: string
      policeForce: string
      policeContact: string
    }>
  }

  // Risk assessment
  riskData: {
    hasHighRiskMarkers: boolean
    highRiskItems: Array<{
      dateOfInterest: string
      registrationPeriod: number
      riskType: string
      extraInfo: string
      companyName: string
      companyContact: string
      reference: string
    }>
  }

  // Search history
  searchHistory: Array<{
    searchDate: string
    searchTime: string
    businessType: string
  }>

  // Insurance and warranty
  insurance: {
    indemnityMonths: number
    indemnityValueGbp: number
  }

  // Risk summary
  riskSummary: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
    isStolen: boolean
    hasOutstandingFinance: boolean
    isWriteOff: boolean
    isExported: boolean
    isScrapped: boolean
    hasInsuranceClaims: boolean
    hasHighRiskMarkers: boolean
    recommendedAction: string
    warningFlags: string[]
  }
}

/**
 * Parse comprehensive OneAuto HPI API response into structured data
 */
export function parseOneAutoHPIResponse(response: OneAutoHPIResponse): ParsedHPIData | null {
  if (!response.success || !response.result) {
    console.error('OneAuto HPI API returned unsuccessful response:', response.error)
    return null
  }

  const result = response.result

  // Parse basic vehicle information
  const vehicleInfo = {
    registration: result.vehicle_registration_mark,
    vin: result.vehicle_identification_number,
    vinMatch: result.does_vehicle_identification_number_match,
    make: result.dvla_manufacturer_desc,
    model: result.dvla_model_desc,
    colour: result.colour,
    fuelType: result.dvla_fuel_desc,
    bodyType: result.dvla_body_desc,
    transmission: result.dvla_transmission_desc,
    gears: result.number_gears,
    seats: result.number_seats,
    engineCapacity: result.engine_capacity_cc,
    engineNumber: result.engine_number,
    co2Emissions: result.co2_gkm,
    manufacturedYear: result.manufactured_year,
    registrationDate: result.registration_date,
    firstRegistrationDate: result.first_registration_date,
    usedBeforeFirstReg: result.used_before_first_registration
  }

  // Parse legal status
  const legalStatus = {
    isScrapped: result.is_scrapped,
    scrappedDate: result.scrapped_date,
    isExported: result.is_exported,
    exportedDate: result.exported_date,
    isImported: result.is_imported,
    isNonEuImport: result.is_non_eu_import,
    priorGbVrm: result.prior_gb_vrm,
    priorNiVrm: result.prior_ni_vrm
  }

  // Parse technical specifications
  const technicalSpecs = {
    wheelplan: result.dvla_wheelplan,
    maxPermissableMass: result.maximum_permissable_mass_kg,
    powerWeightRatio: result.power_weight_ratio_kw_kg,
    minKerbWeight: result.min_kerbweight_kg,
    grossVehicleWeight: result.gross_vehicleweight_kg,
    maxNetPower: result.max_netpower_kw,
    maxBrakedTowingWeight: result.max_braked_towing_weight_kg,
    maxUnbrakedTowingWeight: result.max_unbraked_towing_weight_kg,
    stationarySoundLevel: result.stationary_soundlevel_db,
    stationarySoundRpm: result.stationary_soundlevel_rpm,
    driveBySoundLevel: result.driveby_soundlevel_db
  }

  // Parse document history
  const documentHistory = {
    v5cIssued: result.v5c_data_items.map(item => ({
      dateIssued: item.date_v5c_issued
    })),
    identityChecks: result.vehicle_identity_check_items.map(item => ({
      date: item.date_of_vehicle_identity_check,
      result: item.result_of_vehicle_identity_check
    }))
  }

  // Parse ownership history
  const keeperData = result.keeper_data_items[0] || {}
  const colourData = result.colour_data_items[0] || {}
  const ownershipHistory = {
    numberOfPreviousKeepers: keeperData.number_previous_keepers || 0,
    lastKeeperChangeDate: keeperData.date_of_last_keeper_change || '',
    colourChanges: {
      numberOfPreviousColours: colourData.number_previous_colours || 0,
      lastColourChangeDate: colourData.date_of_last_colour_change || '',
      lastColour: colourData.last_colour || ''
    }
  }

  // Parse finance information
  const financeHistory = {
    hasOutstandingFinance: result.finance_data_qty > 0,
    financeAgreements: result.finance_data_items.map(item => ({
      startDate: item.finance_start_date,
      termMonths: item.finance_term_months,
      type: item.finance_type,
      company: item.finance_company,
      contactNumber: item.finance_company_contact_number,
      agreementNumber: item.finance_agreement_number,
      vehicleDescription: item.financed_vehicle_desc
    }))
  }

  // Parse cherished transfers
  const cherishedTransfers = result.cherished_data_items.map(item => ({
    transferDate: item.cherished_plate_transfer_date,
    previousVrm: item.previous_vehicle_registration_mark,
    receiptDate: item.date_of_receipt,
    transferType: item.transfer_type,
    currentVrm: item.current_vehicle_registration_mark
  }))

  // Parse condition and theft data
  const conditionData = {
    hasInsuranceClaims: result.condition_data_qty > 0,
    isStolen: result.stolen_vehicle_data_qty > 0,
    claims: result.condition_data_items.map(item => ({
      dateOfLoss: item.date_of_loss,
      status: item.vehicle_status,
      theftIndicator: item.theft_indictor_literal,
      insurerName: item.insurer_name,
      insurerContact: item.insurer_contact_number,
      claimNumber: item.insurer_claim_number,
      lossType: item.loss_type,
      dateRemoved: item.date_removed
    })),
    stolenVehicleReports: result.stolen_vehicle_data_items.map(item => ({
      dateReported: item.date_reported,
      policeForce: item.police_force,
      policeContact: item.police_force_contact_number
    }))
  }

  // Parse risk data
  const riskData = {
    hasHighRiskMarkers: result.high_risk_data_qty > 0,
    highRiskItems: result.high_risk_data_items.map(item => ({
      dateOfInterest: item.date_of_interest,
      registrationPeriod: item.registration_period,
      riskType: item.high_risk_type,
      extraInfo: item.extra_information,
      companyName: item.company_name,
      companyContact: item.company_contact_number,
      reference: item.company_contact_reference
    }))
  }

  // Parse search history
  const searchHistory = result.previous_search_items.map(item => ({
    searchDate: item.date_of_search,
    searchTime: item.time_of_search,
    businessType: item.business_type_searching
  }))

  // Parse insurance information
  const insurance = {
    indemnityMonths: result.indemnity_months,
    indemnityValueGbp: result.indemnity_gbp
  }

  // Generate risk summary
  const riskSummary = generateRiskSummary({
    isStolen: conditionData.isStolen,
    hasOutstandingFinance: financeHistory.hasOutstandingFinance,
    isWriteOff: conditionData.hasInsuranceClaims && conditionData.claims.some(c => 
      c.status.includes('STOLEN') || c.lossType === 'T'
    ),
    isExported: legalStatus.isExported,
    isScrapped: legalStatus.isScrapped,
    hasInsuranceClaims: conditionData.hasInsuranceClaims,
    hasHighRiskMarkers: riskData.hasHighRiskMarkers,
    numberOfPreviousKeepers: ownershipHistory.numberOfPreviousKeepers,
    conditionData,
    riskData
  })

  return {
    vehicleInfo,
    legalStatus,
    technicalSpecs,
    documentHistory,
    ownershipHistory,
    financeHistory,
    cherishedTransfers,
    conditionData,
    riskData,
    searchHistory,
    insurance,
    riskSummary
  }
}

/**
 * Generate comprehensive risk assessment
 */
function generateRiskSummary(data: {
  isStolen: boolean
  hasOutstandingFinance: boolean
  isWriteOff: boolean
  isExported: boolean
  isScrapped: boolean
  hasInsuranceClaims: boolean
  hasHighRiskMarkers: boolean
  numberOfPreviousKeepers: number
  conditionData: any
  riskData: any
}): ParsedHPIData['riskSummary'] {
  const warningFlags: string[] = []
  let riskScore = 0

  // Critical risk factors
  if (data.isStolen) {
    warningFlags.push('VEHICLE REPORTED STOLEN')
    riskScore += 100
  }

  if (data.isWriteOff) {
    warningFlags.push('INSURANCE WRITE-OFF')
    riskScore += 80
  }

  if (data.isScrapped) {
    warningFlags.push('VEHICLE SCRAPPED')
    riskScore += 90
  }

  // High risk factors
  if (data.hasOutstandingFinance) {
    warningFlags.push('OUTSTANDING FINANCE')
    riskScore += 50
  }

  if (data.isExported) {
    warningFlags.push('EXPORTED FROM UK')
    riskScore += 40
  }

  if (data.hasHighRiskMarkers) {
    warningFlags.push('HIGH RISK MARKERS PRESENT')
    riskScore += 35
  }

  // Medium risk factors
  if (data.hasInsuranceClaims) {
    warningFlags.push('INSURANCE CLAIMS HISTORY')
    riskScore += 25
  }

  if (data.numberOfPreviousKeepers > 5) {
    warningFlags.push(`HIGH NUMBER OF PREVIOUS OWNERS (${data.numberOfPreviousKeepers})`)
    riskScore += 15
  }

  // Determine overall risk level
  let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  let recommendedAction: string

  if (riskScore >= 70) {
    overallRisk = 'HIGH'
    recommendedAction = 'AVOID PURCHASE - Serious issues detected'
  } else if (riskScore >= 30) {
    overallRisk = 'MEDIUM'
    recommendedAction = 'PROCEED WITH CAUTION - Additional checks recommended'
  } else {
    overallRisk = 'LOW'
    recommendedAction = 'ACCEPTABLE RISK - Standard checks apply'
  }

  return {
    overallRisk,
    isStolen: data.isStolen,
    hasOutstandingFinance: data.hasOutstandingFinance,
    isWriteOff: data.isWriteOff,
    isExported: data.isExported,
    isScrapped: data.isScrapped,
    hasInsuranceClaims: data.hasInsuranceClaims,
    hasHighRiskMarkers: data.hasHighRiskMarkers,
    recommendedAction,
    warningFlags
  }
}

/**
 * Convert parsed HPI data to the existing OneAutoHpiResult format for backward compatibility
 */
export function convertToLegacyFormat(parsedData: ParsedHPIData): import('./oneauto').OneAutoHpiResult {
  return {
    stolen: parsedData.riskSummary.isStolen,
    writeOff: parsedData.riskSummary.isWriteOff,
    mileageDiscrepancy: false, // Not directly available in this response structure
    outstandingFinance: parsedData.riskSummary.hasOutstandingFinance,
    previousOwners: parsedData.ownershipHistory.numberOfPreviousKeepers,
    lastMOT: null, // Not available in this HPI response
    taxStatus: parsedData.legalStatus.isScrapped ? 'SORN' : 'Unknown',
    insuranceGroup: undefined, // Not available in this response
    vehicleCheck: {
      make: parsedData.vehicleInfo.make,
      model: parsedData.vehicleInfo.model,
      colour: parsedData.vehicleInfo.colour,
      fuelType: parsedData.vehicleInfo.fuelType,
      engineSize: parsedData.vehicleInfo.engineCapacity.toString(),
      yearOfManufacture: parsedData.vehicleInfo.manufacturedYear.toString()
    },
    _raw: {
      comprehensiveHpiData: parsedData,
      parseTimestamp: new Date().toISOString()
    }
  }
}
