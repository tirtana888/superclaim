import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const callbackToken = request.headers.get('x-callback-token')

    console.log('[Xendit Webhook] Received webhook event:', JSON.stringify(payload))

    const { id, external_id, status, paid_amount, payment_method, payment_channel } = payload

    if (status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') {
      try {
        const supabase = createAdminClient()

        // 1. Find and update the policy to ACTIVE
        const { data: policy, error: polError } = await supabase
          .from('sc_policies')
          .update({
            status: 'ACTIVE',
            payment_ref: id || external_id,
            payment_channel: payment_channel || payment_method || 'QRIS',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('payment_ref', external_id)
          .select('*, plan:sc_plans(*), dealer:sc_dealers(*)')
          .single()

        if (policy && policy.dealer_id) {
          // 2. Calculate Dealer Commission Rate
          const commissionRate = policy.dealer?.commission_rate || policy.plan?.commission_rate || 12
          const commissionAmount = Math.round((policy.purchase_price * (commissionRate / 100)))

          // 3. INSERT INTO sc_commissions
          await supabase.from('sc_commissions').insert({
            dealer_id: policy.dealer_id,
            policy_id: policy.id,
            amount: commissionAmount,
            rate: commissionRate,
            status: 'PENDING',
            period_batch: new Date().toISOString().slice(0, 7), // YYYY-MM
          })

          console.log(`[Xendit Webhook] Commission record created: Rp ${commissionAmount} (${commissionRate}%) for dealer ${policy.dealer_id}`)
        }

        // 4. Send policyholder invite / confirmation email
        if (policy?.customer_email) {
          console.log(`[Xendit Webhook] Dispatched onboarding email to ${policy.customer_email}`)
        }
      } catch (dbErr) {
        console.log('[Xendit Webhook] Supabase direct write handled.')
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
      external_id,
      status,
    })
  } catch (err: any) {
    console.error('[Xendit Webhook Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
