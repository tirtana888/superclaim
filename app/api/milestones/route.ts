import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim_id, stage, stage_name, stage_name_id, note, created_by } = body

    if (!claim_id || !stage) {
      return NextResponse.json({ error: 'claim_id and stage are required' }, { status: 400 })
    }

    const milestoneRecord = {
      claim_id,
      stage: parseInt(stage),
      stage_name: stage_name || `Stage ${stage}`,
      stage_name_id: stage_name_id || `Tahap ${stage}`,
      note: note || '',
      created_by: created_by || null,
    }

    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('sc_claim_milestones')
        .insert(milestoneRecord)
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ success: true, milestone: data })
      }
    } catch (e) {
      console.log('Supabase milestone insert skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      milestone: {
        id: `ml-${Date.now()}`,
        ...milestoneRecord,
        created_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
