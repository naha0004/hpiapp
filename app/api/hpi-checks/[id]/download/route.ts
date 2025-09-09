import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    // Get the HPI check
    const hpiCheck = await prisma.hPICheck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
        status: 'COMPLETED'
      }
    })

    if (!hpiCheck || !hpiCheck.results) {
      return NextResponse.json({ error: 'HPI check not found or not completed' }, { status: 404 })
    }

    console.log('HPI check results type:', typeof hpiCheck.results)
    console.log('HPI check results:', hpiCheck.results)

    // Parse results (check if it's already an object or needs parsing)
    let results
    try {
      results = typeof hpiCheck.results === 'string' 
        ? JSON.parse(hpiCheck.results) 
        : hpiCheck.results
    } catch (error) {
      console.error('Error parsing results:', error)
      return NextResponse.json({ error: 'Invalid HPI check data' }, { status: 500 })
    }
    
    const vehicleDetails = results.vehicleCheck || {}
    
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>HPI Vehicle Report - ${hpiCheck.registration}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .registration {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .report-date {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .vehicle-details {
            background-color: #f8fafc;
        }
        .safety-checks {
            background-color: #fefefe;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
        }
        .detail-label {
            font-weight: bold;
            color: #374151;
        }
        .check-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .check-item {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .check-clear {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
        }
        .check-alert {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
        }
        .summary {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .summary-clear {
            background-color: #f0fdf4;
            border: 2px solid #22c55e;
            color: #166534;
        }
        .summary-alert {
            background-color: #fef2f2;
            border: 2px solid #ef4444;
            color: #dc2626;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ HPI Vehicle Report</h1>
        <div class="registration">${hpiCheck.registration}</div>
        <div class="report-date">Report generated: ${format(new Date(hpiCheck.completedDate || hpiCheck.createdAt), 'dd/MM/yyyy HH:mm')}</div>
    </div>

    <div class="section vehicle-details">
        <h2>🚗 Vehicle Details</h2>
        <div class="detail-row">
            <span class="detail-label">Make & Model:</span>
            <span>${vehicleDetails.make || 'Unknown'} ${vehicleDetails.model || ''}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Year of Manufacture:</span>
            <span>${vehicleDetails.yearOfManufacture || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Colour:</span>
            <span>${vehicleDetails.colour || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Fuel Type:</span>
            <span>${vehicleDetails.fuelType || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Engine Size:</span>
            <span>${vehicleDetails.engineSize || 'N/A'}</span>
        </div>
        ${results.previousOwners ? `
        <div class="detail-row">
            <span class="detail-label">Previous Owners:</span>
            <span>${results.previousOwners}</span>
        </div>
        ` : ''}
    </div>

    <div class="section safety-checks">
        <h2>🔍 Safety & History Checks</h2>
        <div class="check-grid">
            <div class="check-item ${results.stolen ? 'check-alert' : 'check-clear'}">
                <h3>Stolen Status</h3>
                <p><strong>${results.stolen ? '❌ STOLEN VEHICLE ALERT' : '✅ Clear'}</strong></p>
            </div>
            <div class="check-item ${results.writeOff ? 'check-alert' : 'check-clear'}">
                <h3>Write-off Status</h3>
                <p><strong>${results.writeOff ? '❌ Insurance write-off found' : '✅ No write-off records'}</strong></p>
            </div>
            <div class="check-item ${results.outstandingFinance ? 'check-alert' : 'check-clear'}">
                <h3>Outstanding Finance</h3>
                <p><strong>${results.outstandingFinance ? '❌ Outstanding finance detected' : '✅ No outstanding finance'}</strong></p>
            </div>
            <div class="check-item ${results.mileageDiscrepancy ? 'check-alert' : 'check-clear'}">
                <h3>Mileage Check</h3>
                <p><strong>${results.mileageDiscrepancy ? '❌ Mileage discrepancy found' : '✅ Mileage appears consistent'}</strong></p>
            </div>
        </div>
    </div>

    <div class="summary ${(results.stolen || results.writeOff || results.outstandingFinance || results.mileageDiscrepancy) ? 'summary-alert' : 'summary-clear'}">
        <h2>${(results.stolen || results.writeOff || results.outstandingFinance || results.mileageDiscrepancy) ? '⚠️ ATTENTION REQUIRED' : '✅ ALL CLEAR'}</h2>
        <p>${(results.stolen || results.writeOff || results.outstandingFinance || results.mileageDiscrepancy) 
            ? 'This vehicle has one or more issues that require your attention. Please review the safety checks above carefully before making any purchase decisions.'
            : 'No issues found in our database checks. This appears to be a clean vehicle with no recorded problems.'
        }</p>
    </div>

    <div class="footer">
        <p>This report is generated by ClearRideAI based on available data sources at the time of generation.</p>
        <p>For the most accurate and up-to-date information, please verify details with official sources.</p>
        <p><strong>Report ID:</strong> ${hpiCheck.id} | <strong>Cost:</strong> £${hpiCheck.cost.toFixed(2)}</p>
    </div>
</body>
</html>`;

    // Return HTML content that can be converted to PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="HPI_Report_${hpiCheck.registration}_${format(new Date(hpiCheck.createdAt), 'yyyy-MM-dd')}.html"`
      }
    })

  } catch (error) {
    console.error('Error generating HPI report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
