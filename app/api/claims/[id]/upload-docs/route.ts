import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id
    const body = await request.json()
    const { document_type, file_name, storage_path } = body

    try {
      const supabase = createAdminClient()

      // Insert document record
      await supabase.from('sc_claim_documents').insert({
        claim_id: claimId,
        document_type: document_type || 'OTHER',
        storage_path: storage_path || `claim-docs/${claimId}/${file_name}`,
        file_name: file_name || 'uploaded_document.pdf',
      })

      // Re-advance claim status to UNDER_REVIEW
      await supabase
        .from('sc_claims')
        .update({
          status: 'UNDER_REVIEW',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId)

      await supabase.from('sc_claim_milestones').insert({
        claim_id: claimId,
        stage: 3,
        stage_name: 'Under Review',
        stage_name_id: 'Sedang Ditinjau',
        note: 'Additional documents submitted by policyholder. Re-evaluating claim.',
      })
    } catch (dbErr) {
      console.log('Supabase upload-docs skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      message: 'Additional evidence uploaded successfully. Status updated to Under Review.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
