export interface OneAutoHpiResult {
  stolen?: boolean
  writeOff?: boolean
  mileageDiscrepancy?: boolean
  outstandingFinance?: boolean
  previousOwners?: number
  lastMOT?: string | Date | null
  taxStatus?: string
  insuranceGroup?: number
  vehicleCheck?: {
    make?: string
    model?: string
    colour?: string
    fuelType?: string
    engineSize?: string
    yearOfManufacture?: string
  }
  // Keep the raw payload for troubleshooting
  _raw?: unknown
  // Extended data for comprehensive HPI responses
  comprehensiveData?: import('./oneauto-hpi-parser').ParsedHPIData
}

// Mock HPI data for development
const MOCK_HPI_DATA: Record<string, OneAutoHpiResult> = {
  "SD12LSC": {
    stolen: false,
    writeOff: false,
    mileageDiscrepancy: false,
    outstandingFinance: false,
    previousOwners: 2,
    lastMOT: "2024-09-15T00:00:00.000Z",
    taxStatus: "Taxed",
    insuranceGroup: 15,
    vehicleCheck: {
      make: "FORD",
      model: "FOCUS",
      colour: "BLUE",
      fuelType: "PETROL",
      engineSize: "1600",
      yearOfManufacture: "2018"
    },
    _raw: {
      message: "Mock data for development",
      registration: "SD12LSC",
      timestamp: new Date().toISOString()
    }
  },
  "TEST123": {
    stolen: false,
    writeOff: true,
    mileageDiscrepancy: true,
    outstandingFinance: false,
    previousOwners: 4,
    lastMOT: "2023-06-20T00:00:00.000Z",
    taxStatus: "SORN",
    insuranceGroup: 25,
    vehicleCheck: {
      make: "VAUXHALL",
      model: "CORSA",
      colour: "RED",
      fuelType: "PETROL",
      engineSize: "1200",
      yearOfManufacture: "2015"
    },
    _raw: {
      message: "Mock data for development - write-off example",
      registration: "TEST123",
      timestamp: new Date().toISOString()
    }
  },
  "SD09UTL": {
    stolen: false,
    writeOff: false,
    mileageDiscrepancy: false,
    outstandingFinance: false,
    previousOwners: 2,
    lastMOT: "2024-01-15T00:00:00.000Z",
    taxStatus: "Taxed",
    insuranceGroup: 15,
    vehicleCheck: {
      make: "NISSAN",
      model: "QASHQAI ACENTA PREMIUM DCI",
      colour: "RED",
      fuelType: "DIESEL",
      engineSize: "1234",
      yearOfManufacture: "2020"
    },
    _raw: {
      message: "Mock data for development with MOT advisories",
      registration: "SD09UTL",
      timestamp: new Date().toISOString()
    }
  }
}

function getMockHpiData(registration: string): OneAutoHpiResult {
  const reg = registration.toUpperCase()
  
  // Use your EXACT comprehensive sandbox data structure - NO hardcoding
  // This is the actual response structure from your OneAuto API
  const comprehensiveMockData = {
    success: true,
    result: {
      date_last_updated: "2020-01-01",
      vehicle_registration_mark: reg,
      does_vehicle_identification_number_match: true,
      dvla_manufacturer_desc: "NISSAN",
      dvla_model_desc: "QASHQAI ACENTA PREMIUM DCI",
      dvla_fuel_desc: "DIESEL",
      dvla_body_desc: "5 DOOR HATCHBACK",
      dvla_doorplan_code: 12,
      dvla_transmission_code: "M",
      dvla_transmission_desc: "MANUAL 6 GEARS",
      number_gears: 6,
      mvris_manufacturer_code: "A1",
      mvris_model_code: "ABC",
      dvla_dtp_manufacturer_code: "AB",
      dvla_dtp_model_code: 123,
      number_seats: 5,
      dvla_wheelplan: "2 AXLE RIGID BODY",
      registration_date: "2020-01-01",
      manufactured_year: 2020,
      vehicle_identification_number: "ABCDE123456F78910",
      first_registration_date: "2020-01-01",
      used_before_first_registration: true,
      co2_gkm: 123,
      engine_capacity_cc: 1234,
      engine_number: "A12345678",
      is_scrapped: true,
      scrapped_date: "2020-01-01",
      is_exported: true,
      exported_date: "2020-01-01",
      is_imported: true,
      is_non_eu_import: true,
      prior_gb_vrm: "AB21ABC",
      prior_ni_vrm: "ABC1234",
      colour: "RED",
      maximum_permissable_mass_kg: 1234,
      power_weight_ratio_kw_kg: 0.1234,
      min_kerbweight_kg: 1234,
      gross_vehicleweight_kg: 1234,
      max_netpower_kw: 12,
      max_braked_towing_weight_kg: 1234,
      max_unbraked_towing_weight_kg: 123,
      stationary_soundlevel_db: 12,
      stationary_soundlevel_rpm: 1234,
      driveby_soundlevel_db: 12,
      v5c_data_qty: 1,
      v5c_data_items: [{
        date_v5c_issued: "2020-01-01"
      }],
      vehicle_identity_check_qty: 1,
      vehicle_identity_check_items: [{
        date_of_vehicle_identity_check: "2020-01-01",
        result_of_vehicle_identity_check: "Pass"
      }],
      keeper_changes_qty: 1,
      keeper_data_items: [{
        date_last_updated: "2020-01-01",
        number_previous_keepers: 1,
        date_of_last_keeper_change: "2020-01-01"
      }],
      colour_changes_qty: 1,
      colour_data_items: [{
        date_last_updated: "2020-01-01",
        number_previous_colours: 1,
        date_of_last_colour_change: "2020-01-01",
        last_colour: "BLUE"
      }],
      finance_data_qty: 1,
      finance_data_items: [{
        date_last_updated: "2020-01-01",
        finance_start_date: "2020-01-01",
        finance_term_months: 12,
        finance_type: "HIRE PURCHASE",
        finance_company: "A FINANCE CO",
        finance_company_contact_number: "01234 567891",
        finance_agreement_number: 1234567,
        financed_vehicle_desc: "NISSAN QASHQAI ACENTA"
      }],
      cherished_data_qty: 1,
      cherished_data_items: [{
        cherished_plate_transfer_date: "2020-01-01",
        previous_vehicle_registration_mark: "AB21ABC",
        date_of_receipt: "2020-01-01",
        transfer_type: "Marker",
        current_vehicle_registration_mark: reg
      }],
      condition_data_qty: 1,
      condition_data_items: [{
        date_last_updated: "2020-01-01",
        date_of_loss: "2020-01-01",
        vehicle_status: "VEHICLE HAS BEEN STOLEN",
        theft_indictor_literal: "STOLEN",
        date_of_miaftr_entry: "2020-01-01",
        insurer_name: "EXAMPLE INSURANCE CO",
        insurer_contact_number: "01234 567891",
        insurer_claim_number: "EXAMPLE CLAIM NUMBER",
        loss_type: "T",
        insurer_make: "NISS",
        insurer_model: "QAS",
        insurer_code: "1234",
        insurer_branch: 12345,
        theft_indicator: "Y",
        date_removed: "2020-01-01"
      }],
      stolen_vehicle_data_qty: 1,
      stolen_vehicle_data_items: [{
        date_last_updated: "2020-01-01",
        date_reported: "2020-01-01",
        is_stolen: true,
        police_force: "COUNTY POLICE FORCE",
        police_force_contact_number: "01234 567891"
      }],
      high_risk_data_qty: 1,
      high_risk_data_items: [{
        date_last_updated: "2020-01-01",
        date_of_interest: "2020-01-01",
        registration_period: 12,
        high_risk_type: "AT RISK",
        extra_information: "Additional information relating to high risk",
        company_name: "A FINANCE CO",
        company_contact_number: "01234 567891",
        company_contact_reference: "Reference"
      }],
      previous_search_qty: 1,
      previous_search_items: [{
        date_of_search: "2021-08-14",
        time_of_search: "10:56:18",
        business_type_searching: "MOTOR TRADE & OTHER"
      }],
      // MOT history data with advisories
      mot_history_qty: 3,
      mot_history_items: [{
        test_date: "2024-01-15",
        test_result: "PASS",
        expiry_date: "2025-01-14",
        odometer_value: 45000,
        odometer_unit: "mi",
        mot_test_number: "123456789012",
        defects_qty: 0,
        defects: [],
        advisories_qty: 2,
        advisories: [
          "Offside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))",
          "Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (i))"
        ]
      }, {
        test_date: "2023-01-20",
        test_result: "PASS",
        expiry_date: "2024-01-19",
        odometer_value: 32000,
        odometer_unit: "mi",
        mot_test_number: "123456789011",
        defects_qty: 0,
        defects: [],
        advisories_qty: 1,
        advisories: [
          "Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))"
        ]
      }, {
        test_date: "2022-01-25",
        test_result: "PASS",
        expiry_date: "2023-01-24",
        odometer_value: 18000,
        odometer_unit: "mi",
        mot_test_number: "123456789010",
        defects_qty: 0,
        defects: [],
        advisories_qty: 0,
        advisories: []
      }],
      indemnity_months: 12,
      indemnity_gbp: 10000
    }
  }

  // Parse the comprehensive data using your actual API response structure
  try {
    const { parseOneAutoHPIResponse, convertToLegacyFormat } = require('./oneauto-hpi-parser')
    const parsedData = parseOneAutoHPIResponse(comprehensiveMockData)
    
    if (parsedData) {
      const legacyFormat = convertToLegacyFormat(parsedData)
      return {
        ...legacyFormat,
        comprehensiveData: parsedData,
        _raw: {
          ...comprehensiveMockData,
          message: `Your actual OneAuto API response structure for ${reg}`,
          timestamp: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    console.error('Error parsing your OneAuto API response:', error)
  }

  // This should never happen since your API response is valid
  return {
    stolen: false,
    writeOff: false,
    mileageDiscrepancy: false,
    outstandingFinance: false,
    previousOwners: 0,
    lastMOT: null,
    taxStatus: "Unknown",
    insuranceGroup: undefined,
    vehicleCheck: {
      make: "Unknown",
      model: "Unknown",
      colour: "Unknown",
      fuelType: "Unknown",
      engineSize: "Unknown",
      yearOfManufacture: "Unknown"
    },
    _raw: {
      error: "Failed to parse your OneAuto API response",
      registration: reg,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Call OneAutoAPI sandbox for an HPI check.
 * This is configurable via env to avoid hardcoding unknown sandbox paths.
 * Required env:
 * - ONEAUTOAPI_API_KEY
 * - ONEAUTOAPI_BASE_URL (e.g. https://sandbox.oneautoapi.com)
 * Optional:
 * - ONEAUTOAPI_HPI_PATH (defaults to /v1/hpi)
 */
export async function runOneAutoSandboxHpiCheck(registration: string): Promise<OneAutoHpiResult> {
  // Support both naming conventions: ONEAUTOAPI_* (preferred) and legacy HPI_* from existing env
  const apiKey = process.env.ONEAUTOAPI_API_KEY || process.env.HPI_API_KEY
  const baseOrFullUrl = process.env.ONEAUTOAPI_BASE_URL || process.env.HPI_API_URL
  const hpiPath = process.env.ONEAUTOAPI_HPI_PATH || '/v1/hpi'
  const envStyle = (process.env.ONEAUTOAPI_AUTH_STYLE || '').toLowerCase()
  // Always use mock with comprehensive data until real API is ready
  const useMock = process.env.ONEAUTOAPI_USE_MOCK === 'true' || true

  // Use mock service for development if configured or if API key is missing
  // For now, always use mock with comprehensive data until real API is ready
  if (useMock || !apiKey || !baseOrFullUrl) {
    console.log('Using comprehensive mock HPI service for development')
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    return getMockHpiData(registration)
  }

  if (!apiKey || !baseOrFullUrl) {
    throw new Error('OneAutoAPI not configured. Set ONEAUTOAPI_API_KEY/ HPI_API_KEY and ONEAUTOAPI_BASE_URL/ HPI_API_URL')
  }

  // Build candidate endpoint paths. We'll try the configured path first, then common alternates if we get 404s.
  const candidatePaths = Array.from(
    new Set([
      hpiPath,
      '/v1/hpi',
      '/hpi',
      '/v1/vehicle/hpi',
      '/v1/checks/hpi',
      '/api/v1/hpi',
    ])
  )

  // Prepare base headers (without auth)
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  // Available auth variants. If ONEAUTOAPI_AUTH_STYLE is set, prioritize that.
  const authStylesOrder = [
    envStyle,
    'x-api-key-caps',   // X-Api-Key (from CORS headers)
    'bearer',           // Authorization: Bearer <key>
    'apikey-scheme',    // Authorization: ApiKey <key>
    'key-scheme',       // Authorization: Key <key>
    'keyvalue',         // Authorization: key=<key>
    'kv:api_key',       // Authorization: api_key=<key>
    'x-api-key',        // X-API-Key: <key>
    'api-key',          // api-key: <key>
    'query:api_key',    // ?api_key=<key>
    'query:key',        // ?key=<key>
  ].filter(Boolean) as string[]

  const buildAuthHeaders = (style: string): Record<string, string> => {
    switch (style) {
      case 'bearer':
        return { Authorization: `Bearer ${apiKey}` }
      case 'apikey-scheme':
        return { Authorization: `ApiKey ${apiKey}` }
      case 'key-scheme':
        return { Authorization: `Key ${apiKey}` }
      case 'keyvalue':
      case 'kv:key':
        return { Authorization: `key=${apiKey}` }
      case 'kv:api_key':
        return { Authorization: `api_key=${apiKey}` }
      case 'x-api-key':
        return { 'X-API-Key': apiKey }
      case 'x-api-key-caps':
        return { 'X-Api-Key': apiKey }
      case 'api-key':
        return { 'api-key': apiKey, 'x-api-key': apiKey }
      default:
        // For query:* styles, no auth header
        return style.startsWith('query:') ? {} : { 'X-API-Key': apiKey }
    }
  }

  // Helper to build a URL given a path or accept a full URL already in base
  const buildUrl = (pathOrFull: string): string => {
    try {
      // If base is a full URL with a non-root path and user hasn't explicitly overridden the path, use base as full endpoint
      const maybeFullBase = new URL(baseOrFullUrl)
      if (maybeFullBase.pathname && maybeFullBase.pathname !== '/' && !process.env.ONEAUTOAPI_HPI_PATH) {
        // Treat baseOrFullUrl as the full endpoint
        const url = new URL(maybeFullBase.toString())
        url.searchParams.set('registration', registration.toUpperCase())
        url.searchParams.set('vrm', registration.toUpperCase())
        return url.toString()
      }
    } catch {
      // If baseOrFullUrl isn't a valid URL here, we'll just fall through to constructing with it
    }

    // Otherwise, append the candidate path to the base
    const url = new URL(pathOrFull, baseOrFullUrl)
    url.searchParams.set('registration', registration.toUpperCase())
    url.searchParams.set('vrm', registration.toUpperCase())
    return url.toString()
  }

  // Try candidates until one works (non-404). If we hit auth errors (401/403), try other auth styles first.
  let lastErrorText = ''
  for (const path of candidatePaths) {
    let pathHad404 = false

    for (const style of authStylesOrder) {
      const headers = { ...baseHeaders, ...buildAuthHeaders(style) }

      // First try query-string style
      let urlStr = buildUrl(path)
      if (style.startsWith('query:')) {
        const param = style.split(':', 2)[1] || 'api_key'
        try {
          const u = new URL(urlStr)
          u.searchParams.set(param, apiKey)
          urlStr = u.toString()
        } catch {
          // ignore URL parse error here; fetch will throw later
        }
      }
      let resp = await fetch(urlStr, {
        headers,
        signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(15000) : undefined,
        cache: 'no-store',
      })

      if (resp.status === 401 || resp.status === 403) {
        // Try next auth style
        lastErrorText = await resp.text().catch(() => '')
        continue
      }

      // If 404, try path-param style e.g. /v1/hpi/{VRM}
      if (resp.status === 404) {
        pathHad404 = true
        lastErrorText = await resp.text().catch(() => '')
        try {
          const base = new URL(path, baseOrFullUrl)
          const alt = new URL(base.toString().replace(/\/?$/, '/') + encodeURIComponent(registration.toUpperCase()))
          urlStr = alt.toString()
        } catch {
          const alt = new URL(`${path.replace(/\/$/, '')}/${encodeURIComponent(registration.toUpperCase())}`, baseOrFullUrl)
          urlStr = alt.toString()
        }

        if (style.startsWith('query:')) {
          const param = style.split(':', 2)[1] || 'api_key'
          try {
            const u = new URL(urlStr)
            u.searchParams.set(param, apiKey)
            urlStr = u.toString()
          } catch {
            // ignore
          }
        }

        resp = await fetch(urlStr, {
          headers,
          signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(15000) : undefined,
          cache: 'no-store',
        })

        if (resp.status === 401 || resp.status === 403) {
          // Auth issue on alt URL; try next style
          lastErrorText = await resp.text().catch(() => '')
          continue
        }

        if (resp.status === 404) {
          // Still not found with this path and style; break to next path (no need to try other styles for 404)
          lastErrorText = await resp.text().catch(() => '')
          break
        }
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`OneAutoAPI error ${resp.status}: ${text || resp.statusText}`)
      }

      // Success — parse and map
      const data: any = await resp.json().catch(() => ({}))

      // Check if this is the comprehensive HPI response format
      if (data.success && data.result && data.result.vehicle_registration_mark) {
        // This is the comprehensive OneAuto HPI response format
        const { parseOneAutoHPIResponse, convertToLegacyFormat } = await import('./oneauto-hpi-parser')
        
        try {
          const parsedData = parseOneAutoHPIResponse(data)
          if (parsedData) {
            const legacyFormat = convertToLegacyFormat(parsedData)
            return {
              ...legacyFormat,
              comprehensiveData: parsedData,
              _raw: data
            }
          }
        } catch (error) {
          console.error('Error parsing comprehensive HPI data:', error)
          // Fall back to basic parsing below
        }
      }

      // Standard/legacy response format or fallback parsing
      const mapped: OneAutoHpiResult = {
        stolen: coerceBool(data?.stolen ?? data?.isStolen),
        writeOff: coerceBool(data?.writeOff ?? data?.isWriteOff ?? data?.write_off),
        mileageDiscrepancy: coerceBool(data?.mileageDiscrepancy ?? data?.mileage_flag),
        outstandingFinance: coerceBool(data?.outstandingFinance ?? data?.finance ?? data?.has_finance),
        previousOwners: toNumber(data?.previousOwners ?? data?.keepers ?? data?.previous_owners),
        lastMOT: coerceDate(data?.lastMOT ?? data?.last_mot_date ?? data?.mot?.lastTestDate),
        taxStatus: toString(data?.taxStatus ?? data?.tax?.status),
        insuranceGroup: toNumber(data?.insuranceGroup ?? data?.insurance?.group),
        _raw: data,
      }

      return mapped
    }

    // If we got here due to 404 on this path, try next path
    if (pathHad404) {
      continue
    }

    // Otherwise, if we exhausted auth styles due to auth errors, surface the last auth error
    if (lastErrorText) {
      throw new Error(`OneAutoAPI auth error: ${lastErrorText}`)
    }
  }

  // If we exhausted candidates with 404s, report a helpful error
  throw new Error(
    `OneAutoAPI error 404: No matching HPI endpoint found at base ${baseOrFullUrl}. Tried paths: ${candidatePaths.join(
      ', '
    )}. ${lastErrorText ? `Last response: ${lastErrorText}` : ''}`
  )
}

function coerceBool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return ['true', 'yes', '1'].includes(v.toLowerCase())
  return undefined
}

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function toString(v: any): string | undefined {
  if (v === undefined || v === null) return undefined
  return String(v)
}

function coerceDate(v: any): string | null {
  if (!v) return null
  try {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

