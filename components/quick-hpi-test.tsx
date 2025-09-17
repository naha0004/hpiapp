/**
 * Quick Test Component for Comprehensive HPI Data
 * Add this to any page to test the comprehensive HPI functionality
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { runOneAutoSandboxHpiCheck } from '@/lib/oneauto'

export function QuickHPITest() {
  const [registration, setRegistration] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    if (!registration.trim()) return
    
    setIsLoading(true)
    try {
      const hpiResult = await runOneAutoSandboxHpiCheck(registration.trim())
      setResult(hpiResult)
      console.log('HPI Result:', hpiResult)
    } catch (error) {
      console.error('Test failed:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Quick HPI Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            placeholder="Enter any registration (e.g., AB12CDE)"
            className="uppercase"
          />
          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test HPI'}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Result:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Stolen: {result.stolen ? '⚠️ YES' : '✅ No'}</div>
                <div>Write-off: {result.writeOff ? '⚠️ YES' : '✅ No'}</div>
                <div>Finance: {result.outstandingFinance ? '⚠️ Outstanding' : '✅ Clear'}</div>
                <div>Previous Owners: {result.previousOwners || 'N/A'}</div>
              </div>
            </div>

            {result.comprehensiveData && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800">✨ Comprehensive Data Available!</h3>
                <div className="text-sm text-blue-700">
                  <p>Risk Level: <strong>{result.comprehensiveData.riskSummary.overallRisk}</strong></p>
                  <p>Warning Flags: {result.comprehensiveData.riskSummary.warningFlags.length}</p>
                  <p>Finance Agreements: {result.comprehensiveData.financeHistory.financeAgreements.length}</p>
                  <p>Insurance Claims: {result.comprehensiveData.conditionData.claims.length}</p>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  <strong>Note:</strong> Finance data supplied by Experian. Other data sourced independently. 
                  We exclude liability for data inaccuracies.
                </div>
              </div>
            )}

            {result.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuickHPITest
