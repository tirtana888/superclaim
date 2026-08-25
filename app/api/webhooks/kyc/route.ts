import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim_id, verification_id, status, confidence_score, provider } = body

    console.log(`[eKYC Webhook] Received KYC callback for Claim ID: ${claim_id}, Status: ${status}, Confidence: ${confidence_score}`)

    const isPassed = status === 'SUCCESS' || status === 'PASSED' || (confidence_score && confidence_score >= 80)

    try {
      const supabase = createAdminClient()
      
      // Update claim KYC status
      await supabase
        .from('sc_claims')
        .update({
          kyc_status: isPassed ? 'PASSED' : 'FAILED',
          status: isPassed ? 'UNDER_REVIEW' : 'KYC_PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim_id)

      // Insert KYC audit log
      await supabase.from('sc_kyc_records').insert({
        claim_id,
        user_id: body.user_id,
        provider: provider || 'verihubs',
        status: isPassed ? 'PASSED' : 'FAILED',
        provider_ref: verification_id,
        verified_at: new Date().toISOString(),
        metadata: body,
      })

      // Advance milestone
      if (isPassed) {
        await supabase.from('sc_claim_milestones').insert({
          claim_id,
          stage: 3,
          stage_name: 'Under Review',
          stage_name_id: 'Sedang Ditinjau',
          note: 'eKYC verification completed successfully. Claim forwarded to adjudication team.',
        })
      }
    } catch (dbErr) {
      console.log('[eKYC Webhook] DB update skipped in store mode.')
    }

    return NextResponse.json({
      success: true,
      claim_id,
      kyc_status: isPassed ? 'PASSED' : 'FAILED',
      next_stage: isPassed ? 'UNDER_REVIEW' : 'KYC_PENDING',
    })
  } catch (err: any) {
    console.error('[eKYC Webhook Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
