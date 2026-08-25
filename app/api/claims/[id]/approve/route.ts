import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id
    const body = await request.json()
    const { approved_amount, reviewer_id } = body

    const approvedNum = parseFloat(approved_amount)
    if (!approvedNum || approvedNum <= 0) {
      return NextResponse.json({ error: 'Valid approved amount is required' }, { status: 400 })
    }

    // Auto-calculate mandatory 5% platform deductible
    const deductibleAmount = Math.round(approvedNum * 0.05)
    const netPayout = approvedNum - deductibleAmount

    try {
      const supabase = createAdminClient()
      
      // Update claim
      const { data, error } = await supabase
        .from('sc_claims')
        .update({
          approved_amount: approvedNum,
          deductible_amount: deductibleAmount,
          net_payout: netPayout,
          status: 'PAYOUT_PROCESSING',
          reviewed_by: reviewer_id || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId)
        .select()
        .single()

      // Insert Milestone Stage 5 (Decision Made) & Stage 6 (Payout Processing)
      await supabase.from('sc_claim_milestones').insert([
        {
          claim_id: claimId,
          stage: 5,
          stage_name: 'Approved',
          stage_name_id: 'Klaim Disetujui',
          note: `Approved at Rp ${approvedNum.toLocaleString('id-ID')}. 5% deductible (Rp ${deductibleAmount.toLocaleString('id-ID')}) applied. Net payout: Rp ${netPayout.toLocaleString('id-ID')}.`,
        },
        {
          claim_id: claimId,
          stage: 6,
          stage_name: 'Payout Processing',
          stage_name_id: 'Pembayaran Diproses',
          note: 'Payout queued for bank transfer / Xendit disbursement.',
        },
      ])

      if (data) {
        return NextResponse.json({ success: true, claim: data })
      }
    } catch (dbErr) {
      console.log('Supabase approve skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claimId,
        approved_amount: approvedNum,
        deductible_amount: deductibleAmount,
        net_payout: netPayout,
        status: 'PAYOUT_PROCESSING',
        reviewed_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
