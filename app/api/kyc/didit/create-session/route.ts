import { NextRequest, NextResponse } from 'next/server'
import { createDiditSession } from '@/lib/didit/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim_id, policy_id, user_id, language } = body

    if (!claim_id) {
      return NextResponse.json({ error: 'claim_id is required' }, { status: 400 })
    }

    const session = await createDiditSession({
      vendorData: claim_id,
      language: language || 'id',
      metadata: {
        claim_id,
        policy_id,
        user_id,
        platform: 'SuperClaim_v2.0',
      },
    })

    return NextResponse.json({
      success: true,
      provider: 'didit.me',
      session_id: session.sessionId,
      verification_url: session.url,
      session_token: session.sessionToken,
    })
  } catch (err: any) {
    console.error('[Didit Create Session Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to create Didit session' }, { status: 500 })
  }
}
