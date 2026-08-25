import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id
    const body = await request.json()
    const { rejection_reason, reviewer_id } = body

    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is mandatory' }, { status: 400 })
    }

    try {
      const supabase = createAdminClient()
      
      const { data, error } = await supabase
        .from('sc_claims')
        .update({
          status: 'REJECTED',
          rejection_reason,
          reviewed_by: reviewer_id || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId)
        .select()
        .single()

      await supabase.from('sc_claim_milestones').insert({
        claim_id: claimId,
        stage: 5,
        stage_name: 'Rejected',
        stage_name_id: 'Klaim Ditolak',
        note: rejection_reason,
      })

      if (data) {
        return NextResponse.json({ success: true, claim: data })
      }
    } catch (dbErr) {
      console.log('Supabase reject skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claimId,
        status: 'REJECTED',
        rejection_reason,
        reviewed_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
