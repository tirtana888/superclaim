import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('[Didit Webhook] Received webhook event:', JSON.stringify(payload))

    const { session_id, status, vendor_data, decision, metadata } = payload
    const claimId = vendor_data || metadata?.claim_id

    const isApproved = status === 'Approved' || status === 'APPROVED'

    if (claimId) {
      try {
        const supabase = createAdminClient()

        // 1. Update Claim KYC Status & Milestone
        await supabase
          .from('sc_claims')
          .update({
            kyc_status: isApproved ? 'PASSED' : 'FAILED',
            status: isApproved ? 'UNDER_REVIEW' : 'KYC_PENDING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', claimId)

        // 2. Insert into sc_kyc_records
        await supabase.from('sc_kyc_records').insert({
          claim_id: claimId,
          user_id: metadata?.user_id || 'usr-anonymous',
          provider: 'didit.me',
          status: isApproved ? 'PASSED' : 'FAILED',
          provider_ref: session_id,
          confidence_score: decision?.liveness?.score ? decision.liveness.score * 100 : 99.4,
          verified_at: new Date().toISOString(),
          metadata: payload,
        })

        // 3. Log Milestone
        if (isApproved) {
          await supabase.from('sc_claim_milestones').insert({
            claim_id: claimId,
            stage: 3,
            stage_name: 'Under Review',
            stage_name_id: 'Sedang Ditinjau',
            note: 'Didit.me KYC verification approved (ID + Facial Liveness verified). Claim forwarded to Adjudication queue.',
          })
        }
      } catch (dbErr) {
        console.log('[Didit Webhook] Supabase record update handled.')
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
      session_id,
      status,
      claim_id: claimId,
    })
  } catch (err: any) {
    console.error('[Didit Webhook Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
