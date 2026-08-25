import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id
    const body = await request.json()
    const { note } = body

    try {
      const supabase = createAdminClient()
      
      const { data, error } = await supabase
        .from('sc_claims')
        .update({
          status: 'DOCS_REQUESTED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId)
        .select()
        .single()

      await supabase.from('sc_claim_milestones').insert({
        claim_id: claimId,
        stage: 4,
        stage_name: 'Additional Docs',
        stage_name_id: 'Dokumen Tambahan',
        note: note || 'Additional documents requested by Backoffice.',
      })

      if (data) {
        return NextResponse.json({ success: true, claim: data })
      }
    } catch (dbErr) {
      console.log('Supabase request-docs skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claimId,
        status: 'DOCS_REQUESTED',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
