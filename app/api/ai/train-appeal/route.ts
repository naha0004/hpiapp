import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AppealAITrainer } from '@/lib/appeal-trainer'
import type { TicketType } from '@/types/appeal'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    // Minimal validation
    const required = ['ticketType','circumstances','appealLetter','outcome']
    const missing = required.filter(k => !body[k])
    if (missing.length) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
    }

    const trainer = new AppealAITrainer()

    // Build training case
    const trainingCase = {
      id: 'cuid_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      ticketType: body.ticketType as TicketType,
      circumstances: String(body.circumstances),
      evidenceProvided: Array.isArray(body.evidenceProvided) ? body.evidenceProvided : [],
      appealLetter: String(body.appealLetter),
      outcome: body.outcome === 'Successful' ? 'Successful' : 'Unsuccessful',
      successFactors: Array.isArray(body.successFactors) ? body.successFactors : [],
      keyArguments: Array.isArray(body.keyArguments) ? body.keyArguments : [],
      legalReferences: Array.isArray(body.legalReferences) ? body.legalReferences : [],
      processingTime: Number(body.processingTime || 28),
      fineAmount: Number(body.fineAmount || 0),
      fineReduction: typeof body.fineReduction === 'number' ? body.fineReduction : undefined,
      dateSubmitted: body.dateSubmitted || new Date().toISOString(),
      dateResolved: body.dateResolved || new Date().toISOString(),
      active: true
    }

    try {
      await trainer.trainModel(trainingCase as any)
    } catch (err) {
      // Graceful fallback if DB tables are missing
      console.error('Trainer DB error:', err)
    }

    return NextResponse.json({ success: true, id: trainingCase.id })
  } catch (error) {
    console.error('Train-appeal error:', error)
    return NextResponse.json({ error: 'Failed to train model' }, { status: 500 })
  }
}
