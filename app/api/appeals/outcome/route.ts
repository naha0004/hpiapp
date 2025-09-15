import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appealId, outcome, notes } = body;

    if (!appealId || !outcome) {
      return NextResponse.json(
        { error: 'Appeal ID and outcome are required' },
        { status: 400 }
      );
    }

    // Validate outcome
    if (!['successful', 'unsuccessful', 'pending'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be: successful, unsuccessful, or pending' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the appeal belongs to the user
    const appeal = await prisma.appeal.findFirst({
      where: {
        id: appealId,
        userId: user.id
      }
    });

    if (!appeal) {
      return NextResponse.json(
        { error: 'Appeal not found or access denied' },
        { status: 404 }
      );
    }

    // Update the appeal with user-reported outcome
    const updatedAppeal = await prisma.appeal.update({
      where: { id: appealId },
      data: {
        userReportedOutcome: outcome,
        userReportedAt: new Date(),
        outcomeNotes: notes || null,
        status: outcome === 'successful' ? 'APPROVED' : 
                outcome === 'unsuccessful' ? 'REJECTED' : 'UNDER_REVIEW'
      }
    });

    // Log the outcome update for analytics
    await prisma.apiAnalytics.create({
      data: {
        endpoint: '/api/appeals/outcome',
        method: 'POST',
        statusCode: 200,
        responseTime: 0,
        userId: user.id,
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 'Unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Appeal outcome updated successfully',
      appeal: {
        id: updatedAppeal.id,
        outcome: updatedAppeal.userReportedOutcome,
        reportedAt: updatedAppeal.userReportedAt,
        status: updatedAppeal.status
      }
    });

  } catch (error) {
    console.error('Appeal outcome update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update appeal outcome',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all appeals for the user
    const appeals = await prisma.appeal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        reason: true,
        location: true,
        status: true,
        aiGenerated: true,
        aiGeneratedAt: true,
        userReportedOutcome: true,
        userReportedAt: true,
        outcomeNotes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      appeals: appeals
    });

  } catch (error) {
    console.error('Appeal retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve appeals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
