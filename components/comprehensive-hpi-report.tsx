import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Car, 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Search,
  TrendingUp,
  Weight,
  Fuel,
  Settings,
  Eye,
  Phone
} from 'lucide-react'
import type { ParsedHPIData } from '@/lib/oneauto-hpi-parser'

interface ComprehensiveHPIReportProps {
  data: ParsedHPIData
  registration: string
}

export function ComprehensiveHPIReport({ data, registration }: ComprehensiveHPIReportProps) {
  const getRiskBadgeColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getRiskIcon = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'HIGH': return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comprehensive HPI Report
        </h1>
        <p className="text-lg text-gray-600">
          Vehicle Registration: <span className="font-mono font-semibold">{registration}</span>
        </p>
      </div>

      {/* Risk Assessment - Critical Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getRiskIcon(data.riskSummary.overallRisk)}
              <div>
                <Badge className={getRiskBadgeColor(data.riskSummary.overallRisk)}>
                  {data.riskSummary.overallRisk} RISK
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {data.riskSummary.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {data.riskSummary.warningFlags.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {data.riskSummary.warningFlags.map((flag, index) => (
                    <div key={index} className="font-semibold text-red-700">
                      ⚠️ {flag}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl ${data.riskSummary.isStolen ? 'text-red-600' : 'text-green-600'}`}>
                {data.riskSummary.isStolen ? '🚨' : '✅'}
              </div>
              <p className="text-sm font-medium">Theft Status</p>
              <p className="text-xs text-gray-500">
                {data.riskSummary.isStolen ? 'STOLEN' : 'Clear'}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${data.riskSummary.hasOutstandingFinance ? 'text-red-600' : 'text-green-600'}`}>
                {data.riskSummary.hasOutstandingFinance ? '💳' : '✅'}
              </div>
              <p className="text-sm font-medium">Finance</p>
              <p className="text-xs text-gray-500">
                {data.riskSummary.hasOutstandingFinance ? 'Outstanding' : 'Clear'}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${data.riskSummary.isWriteOff ? 'text-red-600' : 'text-green-600'}`}>
                {data.riskSummary.isWriteOff ? '🔧' : '✅'}
              </div>
              <p className="text-sm font-medium">Write-Off</p>
              <p className="text-xs text-gray-500">
                {data.riskSummary.isWriteOff ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${data.riskSummary.isScrapped ? 'text-red-600' : 'text-green-600'}`}>
                {data.riskSummary.isScrapped ? '🗑️' : '✅'}
              </div>
              <p className="text-sm font-medium">Scrapped</p>
              <p className="text-xs text-gray-500">
                {data.riskSummary.isScrapped ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Make & Model</p>
              <p className="font-semibold">{data.vehicleInfo.make} {data.vehicleInfo.model}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Year</p>
              <p className="font-semibold">{data.vehicleInfo.manufacturedYear}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Colour</p>
              <p className="font-semibold">{data.vehicleInfo.colour}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fuel Type</p>
              <p className="font-semibold">{data.vehicleInfo.fuelType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Engine Size</p>
              <p className="font-semibold">{data.vehicleInfo.engineCapacity}cc</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Body Type</p>
              <p className="font-semibold">{data.vehicleInfo.bodyType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Transmission</p>
              <p className="font-semibold">{data.vehicleInfo.transmission}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Seats</p>
              <p className="font-semibold">{data.vehicleInfo.seats}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">CO2 Emissions</p>
              <p className="font-semibold">{data.vehicleInfo.co2Emissions}g/km</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Vehicle Identification</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-mono">{data.vehicleInfo.vin}</p>
              <div className="flex items-center gap-2 mt-1">
                {data.vehicleInfo.vinMatch ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs">
                  {data.vehicleInfo.vinMatch ? 'VIN Match Confirmed' : 'VIN Mismatch Detected'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Ownership History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Keeper Changes</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Previous Keepers:</span>
                  <span className="font-semibold">{data.ownershipHistory.numberOfPreviousKeepers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Change:</span>
                  <span className="font-semibold">
                    {new Date(data.ownershipHistory.lastKeeperChangeDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Colour History</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Colour Changes:</span>
                  <span className="font-semibold">{data.ownershipHistory.colourChanges.numberOfPreviousColours}</span>
                </div>
                {data.ownershipHistory.colourChanges.lastColour && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Previous Colour:</span>
                      <span className="font-semibold">{data.ownershipHistory.colourChanges.lastColour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Change Date:</span>
                      <span className="font-semibold">
                        {new Date(data.ownershipHistory.colourChanges.lastColourChangeDate).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Information */}
      {data.financeHistory.hasOutstandingFinance && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <CreditCard className="w-6 h-6" />
              Outstanding Finance
            </CardTitle>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Finance data supplied by Experian</strong> - Finance agreements and outstanding finance information 
                is provided by Experian, the authoritative source for vehicle finance data in the UK.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                This vehicle has outstanding finance agreements. Purchase may be restricted.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {data.financeHistory.financeAgreements.map((agreement, index) => (
                <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Finance Company</p>
                      <p className="font-semibold">{agreement.company}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Finance Type</p>
                      <p className="font-semibold">{agreement.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Start Date</p>
                      <p className="font-semibold">{new Date(agreement.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Term</p>
                      <p className="font-semibold">{agreement.termMonths} months</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Contact</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {agreement.contactNumber}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Claims & Security */}
      {(data.conditionData.hasInsuranceClaims || data.conditionData.isStolen) && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Shield className="w-6 h-6" />
              Insurance & Security History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.conditionData.isStolen && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <XCircle className="w-4 h-4" />
                <AlertDescription className="text-red-800">
                  <strong>STOLEN VEHICLE:</strong> This vehicle has been reported as stolen.
                </AlertDescription>
              </Alert>
            )}

            {data.conditionData.stolenVehicleReports.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-red-700">Theft Reports</h4>
                {data.conditionData.stolenVehicleReports.map((report, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg mb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Reported: {new Date(report.dateReported).toLocaleDateString()}</span>
                      <Badge variant="destructive">Stolen</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Police Force: {report.policeForce} | Contact: {report.policeContact}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {data.conditionData.claims.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Insurance Claims</h4>
                {data.conditionData.claims.map((claim, index) => (
                  <div key={index} className="bg-orange-50 p-3 rounded-lg mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">
                        {new Date(claim.dateOfLoss).toLocaleDateString()}
                      </span>
                      <Badge variant="secondary">{claim.lossType === 'T' ? 'Theft' : claim.lossType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{claim.status}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Insurer: {claim.insurerName} | Claim: {claim.claimNumber}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Technical Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Weight className="w-4 h-4" />
                Weight & Mass
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Permissible:</span>
                  <span className="font-semibold">{data.technicalSpecs.maxPermissableMass}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min Kerb Weight:</span>
                  <span className="font-semibold">{data.technicalSpecs.minKerbWeight}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Vehicle:</span>
                  <span className="font-semibold">{data.technicalSpecs.grossVehicleWeight}kg</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Net Power:</span>
                  <span className="font-semibold">{data.technicalSpecs.maxNetPower}kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Power/Weight:</span>
                  <span className="font-semibold">{data.technicalSpecs.powerWeightRatio}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Towing Capacity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Braked:</span>
                  <span className="font-semibold">{data.technicalSpecs.maxBrakedTowingWeight}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Unbraked:</span>
                  <span className="font-semibold">{data.technicalSpecs.maxUnbrakedTowingWeight}kg</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document & Search History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Document & Search History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Document History</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">V5C Documents:</span>
                  <span className="font-semibold">{data.documentHistory.v5cIssued.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Identity Checks:</span>
                  <span className="font-semibold">{data.documentHistory.identityChecks.length}</span>
                </div>
              </div>

              {data.documentHistory.identityChecks.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Recent Identity Checks:</p>
                  {data.documentHistory.identityChecks.slice(0, 3).map((check, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                      {new Date(check.date).toLocaleDateString()} - {check.result}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Activity
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Searches:</span>
                  <span className="font-semibold">{data.searchHistory.length}</span>
                </div>
              </div>

              {data.searchHistory.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Recent Searches:</p>
                  {data.searchHistory.slice(0, 3).map((search, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                      <div>{search.searchDate} at {search.searchTime}</div>
                      <div className="text-gray-600">{search.businessType}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Insurance Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Indemnity Period</p>
                <p className="font-semibold text-lg">{data.insurance.indemnityMonths} months</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Indemnity Value</p>
                <p className="font-semibold text-lg">£{data.insurance.indemnityValueGbp.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Legal Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl mb-2 ${data.legalStatus.isScrapped ? 'text-red-600' : 'text-green-600'}`}>
                {data.legalStatus.isScrapped ? '🗑️' : '✅'}
              </div>
              <p className="text-sm font-medium">Scrapped</p>
              <p className="text-xs text-gray-500">{data.legalStatus.isScrapped ? 'Yes' : 'No'}</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${data.legalStatus.isExported ? 'text-orange-600' : 'text-green-600'}`}>
                {data.legalStatus.isExported ? '🚢' : '🇬🇧'}
              </div>
              <p className="text-sm font-medium">Export Status</p>
              <p className="text-xs text-gray-500">{data.legalStatus.isExported ? 'Exported' : 'UK'}</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${data.legalStatus.isImported ? 'text-blue-600' : 'text-gray-400'}`}>
                {data.legalStatus.isImported ? '📥' : '🏠'}
              </div>
              <p className="text-sm font-medium">Import Status</p>
              <p className="text-xs text-gray-500">
                {data.legalStatus.isImported 
                  ? (data.legalStatus.isNonEuImport ? 'Non-EU Import' : 'EU Import') 
                  : 'UK Origin'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-sm font-medium">First Registered</p>
              <p className="text-xs text-gray-500">
                {new Date(data.vehicleInfo.firstRegistrationDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {(data.legalStatus.priorGbVrm || data.legalStatus.priorNiVrm) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Previous Registrations:</p>
              {data.legalStatus.priorGbVrm && (
                <p className="text-sm">GB: <span className="font-mono">{data.legalStatus.priorGbVrm}</span></p>
              )}
              {data.legalStatus.priorNiVrm && (
                <p className="text-sm">NI: <span className="font-mono">{data.legalStatus.priorNiVrm}</span></p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-sm text-gray-600 pt-6 border-t space-y-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Data Disclaimers</h4>
          <div className="space-y-2 text-yellow-800">
            <p>
              <strong>Finance Data:</strong> Finance information in this report is supplied by <strong>Experian</strong>, 
              the authoritative source for vehicle finance data in the UK. Experian is responsible for the accuracy 
              of all finance-related information including outstanding finance and hire purchase agreements.
            </p>
            <p>
              <strong>Additional Data Sources:</strong> Salvage, insurance, DVLA, DVSA, and other non-finance data 
              is sourced independently from various automotive databases. <strong>Experian does not provide, endorse, 
              or take responsibility for any non-finance data</strong> in this report.
            </p>
            <p>
              <strong>Data Accuracy:</strong> While we strive for accuracy, we exclude all liability for data 
              inaccuracies. Data may be outdated, incomplete, or subject to errors in source databases. 
              Users should verify critical information through official sources before making decisions.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <p>This comprehensive HPI report was generated from OneAuto API data.</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-2">
            <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
              View full Terms and Conditions
            </Link>
            {" | "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
