import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Claim, Policy, Dealer, Plan, ProductCategory, Commission, ClaimMilestone, KYCStatus, ClaimStatus } from './types'
import { mockPolicies, mockClaims, mockDealers, mockPlans, mockCategories, mockCommissions } from './mock-data'

interface SuperClaimState {
  // Data Collections
  categories: ProductCategory[]
  products: any[]
  plans: Plan[]
  dealers: Dealer[]
  policies: Policy[]
  claims: Claim[]
  commissions: Commission[]
  globalKycEnabled: boolean
  language: 'id' | 'en'

  // Actions - System
  setLanguage: (lang: 'id' | 'en') => void
  toggleGlobalKyc: () => void
  togglePlanKyc: (planId: string) => void

  // Actions - Dealer
  addDealer: (dealer: Omit<Dealer, 'id' | 'created_at' | 'updated_at'>) => Dealer
  updateDealerStatus: (dealerId: string, status: Dealer['status']) => void

  // Actions - Policy & Activation
  createPolicy: (policyData: {
    planId: string
    dealerId?: string
    customerName: string
    customerEmail: string
    customerPhone: string
    deviceCategory: string
    deviceBrand: string
    deviceModel: string
    serialNumber: string
    purchasePrice: number
    paymentChannel: string
  }) => Policy

  // Actions - Claims
  submitClaim: (claimData: {
    policyId: string
    incidentType: 'physical_damage' | 'water_damage' | 'loss' | 'short_circuit'
    incidentDate: string
    incidentLocation: string
    description: string
    claimedAmount: number
    kycPassed?: boolean
    documents?: { name: string; type: string; size: string }[]
  }) => Claim

  adjudicateClaim: (params: {
    claimId: string
    action: 'APPROVE' | 'REJECT' | 'REQUEST_DOCS'
    approvedAmount?: number
    rejectionReason?: string
    docsNote?: string
    reviewerId?: string
  }) => Claim | null

  progressPayout: (claimId: string) => void
  completeClaim: (claimId: string) => void
}

export const useSuperClaimStore = create<SuperClaimState>()(
  persist(
    (set, get) => ({
      categories: mockCategories,
      products: [],
      plans: mockPlans,
      dealers: mockDealers,
      policies: mockPolicies,
      claims: mockClaims,
      commissions: mockCommissions,
      globalKycEnabled: false,
      language: 'id',

      setLanguage: (lang) => set({ language: lang }),
      toggleGlobalKyc: () => set((state) => ({ globalKycEnabled: !state.globalKycEnabled })),
      
      togglePlanKyc: (planId) => set((state) => ({
        plans: state.plans.map((p) =>
          p.id === planId ? { ...p, kyc_required: !p.kyc_required } : p
        ),
      })),

      addDealer: (data) => {
        const newDealer: Dealer = {
          ...data,
          id: `dlr-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ dealers: [newDealer, ...state.dealers] }))
        return newDealer
      },

      updateDealerStatus: (dealerId, status) => set((state) => ({
        dealers: state.dealers.map((d) => (d.id === dealerId ? { ...d, status } : d)),
      })),

      createPolicy: (data) => {
        const plan = get().plans.find((p) => p.id === data.planId) || get().plans[0]
        const policyNumber = `SC-2025-${Math.floor(100000 + Math.random() * 900000)}`
        const startDate = new Date().toISOString()
        const endDate = new Date(Date.now() + plan.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
        const dealer = get().dealers.find((d) => d.id === data.dealerId) || get().dealers[0]

        const newPolicy: Policy = {
          id: `pol-${Date.now()}`,
          policy_number: policyNumber,
          plan_id: data.planId,
          dealer_id: dealer?.id,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          device_category: data.deviceCategory,
          device_brand: data.deviceBrand,
          device_model: data.deviceModel,
          serial_number: data.serialNumber,
          purchase_date: new Date().toISOString().split('T')[0],
          purchase_price: data.purchasePrice,
          start_date: startDate,
          end_date: endDate,
          status: 'ACTIVE',
          payment_ref: `XND-${Date.now()}`,
          payment_channel: data.paymentChannel,
          paid_at: new Date().toISOString(),
          certificate_url: `/certificates/${policyNumber}.pdf`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          plan: plan,
          dealer: dealer,
        }

        // Auto-calculate and accrue dealer commission
        const commRate = dealer ? dealer.commission_rate : plan.commission_rate
        const commAmount = Math.round((plan.price * commRate) / 100)
        const newCommission: Commission = {
          id: `comm-${Date.now()}`,
          dealer_id: dealer?.id || 'dlr-1',
          policy_id: newPolicy.id,
          amount: commAmount,
          rate: commRate,
          status: 'PENDING',
          period_batch: `BATCH-${new Date().toISOString().slice(0, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          policy: newPolicy,
        }

        set((state) => ({
          policies: [newPolicy, ...state.policies],
          commissions: [newCommission, ...state.commissions],
        }))

        return newPolicy
      },

      submitClaim: (data) => {
        const policy = get().policies.find((p) => p.id === data.policyId) || get().policies[0]
        const plan = policy.plan || get().plans.find((p) => p.id === policy.plan_id) || get().plans[0]
        const isKycRequired = get().globalKycEnabled || plan.kyc_required
        const claimRef = `CLM-2025-${Math.floor(10000 + Math.random() * 90000)}`

        const kycStatus: KYCStatus = !isKycRequired ? 'NOT_REQUIRED' : data.kycPassed ? 'PASSED' : 'PENDING'
        const initialStatus: ClaimStatus = isKycRequired && !data.kycPassed ? 'KYC_PENDING' : 'UNDER_REVIEW'

        const initialMilestones: ClaimMilestone[] = [
          {
            id: `ml-${Date.now()}-1`,
            claim_id: '',
            stage: 1,
            stage_name: 'Submitted',
            stage_name_id: 'Klaim Diterima',
            note: 'Claim successfully submitted with evidence documents.',
            created_at: new Date().toISOString(),
          },
        ]

        if (isKycRequired) {
          initialMilestones.push({
            id: `ml-${Date.now()}-2`,
            claim_id: '',
            stage: 2,
            stage_name: 'KYC Verification',
            stage_name_id: 'Verifikasi KYC',
            note: data.kycPassed ? 'Identity verified via liveness & KTP match.' : 'Awaiting identity verification check.',
            created_at: new Date().toISOString(),
          })
        }

        if (initialStatus === 'UNDER_REVIEW') {
          initialMilestones.push({
            id: `ml-${Date.now()}-3`,
            claim_id: '',
            stage: 3,
            stage_name: 'Under Review',
            stage_name_id: 'Sedang Ditinjau',
            note: 'SuperClaim claims team inspecting incident evidence.',
            created_at: new Date().toISOString(),
          })
        }

        const newClaim: Claim = {
          id: `clm-${Date.now()}`,
          claim_ref: claimRef,
          policy_id: data.policyId,
          user_id: 'usr-current',
          incident_type: data.incidentType,
          incident_date: data.incidentDate,
          incident_location: data.incidentLocation,
          description: data.description,
          claimed_amount: data.claimedAmount,
          approved_amount: null,
          deductible_amount: 0,
          net_payout: null,
          status: initialStatus,
          kyc_status: kycStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          policy: policy,
          milestones: initialMilestones,
        }

        newClaim.milestones?.forEach((m) => {
          m.claim_id = newClaim.id
        })

        set((state) => ({ claims: [newClaim, ...state.claims] }))
        return newClaim
      },

      adjudicateClaim: ({ claimId, action, approvedAmount, rejectionReason, docsNote, reviewerId }) => {
        let updatedClaim: Claim | null = null

        set((state) => {
          const updatedClaims = state.claims.map((c) => {
            if (c.id !== claimId) return c

            const milestones = [...(c.milestones || [])]
            const now = new Date().toISOString()

            if (action === 'APPROVE' && approvedAmount) {
              const deductible = Math.round(approvedAmount * 0.05)
              const netPayout = approvedAmount - deductible

              milestones.push({
                id: `ml-${Date.now()}-5`,
                claim_id: c.id,
                stage: 5,
                stage_name: 'Approved',
                stage_name_id: 'Klaim Disetujui',
                note: `Approved at Rp ${approvedAmount.toLocaleString('id-ID')}. 5% platform deductible (Rp ${deductible.toLocaleString('id-ID')}) applied. Net payout: Rp ${netPayout.toLocaleString('id-ID')}.`,
                created_at: now,
              })

              milestones.push({
                id: `ml-${Date.now()}-6`,
                claim_id: c.id,
                stage: 6,
                stage_name: 'Payout Processing',
                stage_name_id: 'Pembayaran Diproses',
                note: 'Disbursement queued to user bank account.',
                created_at: now,
              })

              updatedClaim = {
                ...c,
                approved_amount: approvedAmount,
                deductible_amount: deductible,
                net_payout: netPayout,
                status: 'PAYOUT_PROCESSING',
                reviewed_by: reviewerId || 'SuperClaim Specialist',
                reviewed_at: now,
                updated_at: now,
                milestones,
              }
              return updatedClaim
            } else if (action === 'REJECT') {
              milestones.push({
                id: `ml-${Date.now()}-5`,
                claim_id: c.id,
                stage: 5,
                stage_name: 'Rejected',
                stage_name_id: 'Klaim Ditolak',
                note: rejectionReason || 'Claim does not meet coverage terms.',
                created_at: now,
              })

              updatedClaim = {
                ...c,
                status: 'REJECTED',
                rejection_reason: rejectionReason,
                reviewed_by: reviewerId || 'SuperClaim Specialist',
                reviewed_at: now,
                updated_at: now,
                milestones,
              }
              return updatedClaim
            } else if (action === 'REQUEST_DOCS') {
              milestones.push({
                id: `ml-${Date.now()}-4`,
                claim_id: c.id,
                stage: 4,
                stage_name: 'Additional Docs',
                stage_name_id: 'Dokumen Tambahan',
                note: docsNote || 'Additional photos or police report requested.',
                created_at: now,
              })

              updatedClaim = {
                ...c,
                status: 'DOCS_REQUESTED',
                updated_at: now,
                milestones,
              }
              return updatedClaim
            }

            return c
          })

          return { claims: updatedClaims }
        })

        return updatedClaim
      },

      progressPayout: (claimId) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id !== claimId) return c
            const now = new Date().toISOString()
            const milestones = [
              ...(c.milestones || []),
              {
                id: `ml-${Date.now()}-7`,
                claim_id: c.id,
                stage: 7,
                stage_name: 'Completed',
                stage_name_id: 'Selesai',
                note: `Payout transferred. Claim officially closed.`,
                created_at: now,
              },
            ]
            return {
              ...c,
              status: 'COMPLETED',
              updated_at: now,
              milestones,
            }
          }),
        }))
      },

      completeClaim: (claimId) => {
        get().progressPayout(claimId)
      },
    }),
    {
      name: 'superclaim-store',
    }
  )
)
