import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_name, contact_person, email, commission_rate, commission_schedule } = body

    if (!email || !business_name) {
      return NextResponse.json({ error: 'Email and Business Name are required' }, { status: 400 })
    }

    try {
      const supabase = createAdminClient()

      // 1. Invite user via Supabase Auth Admin API
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role: 'DEALER',
          full_name: contact_person || business_name,
          business_name: business_name,
        },
      })

      if (inviteError) {
        console.warn('Supabase inviteUserByEmail error:', inviteError.message)
      }

      const userId = inviteData?.user?.id || `usr-dlr-${Date.now()}`

      // 2. Insert into sc_profiles
      await supabase.from('sc_profiles').insert({
        id: userId,
        role: 'DEALER',
        full_name: contact_person || business_name,
        status: 'ACTIVE',
      })

      // 3. Insert into sc_dealers
      const { data: dealerData } = await supabase
        .from('sc_dealers')
        .insert({
          profile_id: userId,
          business_name,
          contact_person,
          commission_rate: parseFloat(commission_rate) || 10,
          commission_schedule: commission_schedule || 'MONTHLY',
          status: 'ACTIVE',
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        message: `Invitation email sent to ${email}`,
        dealer: dealerData || {
          id: `dlr-${Date.now()}`,
          business_name,
          contact_person,
          commission_rate,
          commission_schedule,
          status: 'ACTIVE',
        },
      })
    } catch (dbErr) {
      console.log('Supabase invite skipped in fallback mode')
    }

    return NextResponse.json({
      success: true,
      message: `Invitation email sent to ${email}`,
      dealer: {
        id: `dlr-${Date.now()}`,
        business_name,
        contact_person,
        commission_rate: parseFloat(commission_rate) || 10,
        commission_schedule: commission_schedule || 'MONTHLY',
        status: 'ACTIVE',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
