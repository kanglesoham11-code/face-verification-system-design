import React, { useState, useEffect } from 'react'
import {
  Calendar, MapPin, Clock, Search, Plus, X, Tag,
  Users, DollarSign, CheckCircle, Video, CreditCard,
  Trash2, ExternalLink, ChevronDown, ChevronUp, Loader2,
  Shield, AlertTriangle, Receipt, IndianRupee, Percent,
  RefreshCw, Info, Lock, Ticket
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { generateAvatar } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────
interface HirexEvent {
  id: string
  creatorId: string
  creatorName: string
  creatorEmail: string
  title: string
  description: string
  category: string
  format: 'Virtual' | 'In-person'
  date: string
  endDate: string
  maxAttendees: number
  locationOrLink: string
  // Pricing
  price: number            // 0 = free
  earlyBirdPrice: number   // 0 = no early bird
  earlyBirdDeadline: string
  refundPolicy: 'full' | 'partial' | 'none'
  refundDeadlineDays: number
  platformFeePercent: number
  // Meta
  createdAt: string
  status: 'active' | 'cancelled'
  cancellationReason?: string
}

interface EventAttendee {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userFaceImage?: string
  paymentStatus: 'free' | 'paid' | 'refunded'
  paymentId?: string
  amountPaid: number
  registeredAt: string
  ticketCode: string
}

// ── Persistent Storage ──────────────────────────────────────────────────────
function loadEvents(): HirexEvent[] {
  try { return JSON.parse(localStorage.getItem('hirepath-events') || '[]') } catch { return [] }
}
function saveEvents(events: HirexEvent[]) {
  localStorage.setItem('hirepath-events', JSON.stringify(events))
}
function loadAttendees(): EventAttendee[] {
  try { return JSON.parse(localStorage.getItem('hirepath-event-attendees') || '[]') } catch { return [] }
}
function saveAttendees(apps: EventAttendee[]) {
  localStorage.setItem('hirepath-event-attendees', JSON.stringify(apps))
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
const PLATFORM_FEE = 5 // 5%

function generateTicketCode(): string {
  return 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase().slice(-4)
}

function getEffectivePrice(event: HirexEvent): number {
  if (event.price === 0) return 0
  if (event.earlyBirdPrice > 0 && event.earlyBirdDeadline) {
    const deadline = new Date(event.earlyBirdDeadline)
    if (new Date() < deadline) return event.earlyBirdPrice
  }
  return event.price
}

function canRefund(event: HirexEvent): boolean {
  if (event.refundPolicy === 'none') return false
  const eventDate = new Date(event.date)
  const now = new Date()
  const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return daysUntilEvent >= event.refundDeadlineDays
}

// ── Razorpay Script Loader ──────────────────────────────────────────────────
const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    if (document.getElementById('razorpay-script')) { setIsLoaded(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setIsLoaded(true)
    document.body.appendChild(script)
  }, [])
  return isLoaded
}

// ═════════════════════════════════════════════════════════════════════════════
const EventsPage: React.FC = () => {
  const { user } = useAuthStore()
  const isRazorpayLoaded = useRazorpay()

  const [events, setEvents] = useState<HirexEvent[]>([])
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'browse' | 'my-events'>('browse')
  const [showPostForm, setShowPostForm] = useState(false)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Workshop')
  const [format, setFormat] = useState<'Virtual' | 'In-person'>('Virtual')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxAttendees, setMaxAttendees] = useState(100)
  const [locationOrLink, setLocationOrLink] = useState('')
  // Pricing form
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState(0)
  const [earlyBirdPrice, setEarlyBirdPrice] = useState(0)
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState('')
  const [enableEarlyBird, setEnableEarlyBird] = useState(false)
  const [refundPolicy, setRefundPolicy] = useState<'full' | 'partial' | 'none'>('full')
  const [refundDeadlineDays, setRefundDeadlineDays] = useState(3)

  useEffect(() => {
    setEvents(loadEvents())
    setAttendees(loadAttendees())
  }, [])

  // ── Create Event ──────────────────────────────────────────────────────
  const handleCreateEvent = () => {
    if (!title.trim() || !description.trim() || !date) {
      toast.error('Please fill in title, description, and start date')
      return
    }
    if (!isFree && price <= 0) {
      toast.error('Paid events must have a ticket price greater than ₹0')
      return
    }
    if (enableEarlyBird && earlyBirdPrice >= price) {
      toast.error('Early bird price must be less than regular price')
      return
    }
    const newEvent: HirexEvent = {
      id: 'evt-' + Date.now(),
      creatorId: user!.id,
      creatorName: user!.name,
      creatorEmail: user!.email,
      title: title.trim(),
      description: description.trim(),
      category,
      format,
      date,
      endDate: endDate || date,
      maxAttendees,
      locationOrLink: locationOrLink.trim(),
      price: isFree ? 0 : price,
      earlyBirdPrice: (isFree || !enableEarlyBird) ? 0 : earlyBirdPrice,
      earlyBirdDeadline: enableEarlyBird ? earlyBirdDeadline : '',
      refundPolicy: isFree ? 'none' : refundPolicy,
      refundDeadlineDays,
      platformFeePercent: PLATFORM_FEE,
      createdAt: new Date().toISOString(),
      status: 'active',
    }
    const updated = [newEvent, ...events]
    setEvents(updated)
    saveEvents(updated)
    setShowPostForm(false)
    resetForm()
    toast.success('Event published successfully!')
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setDate(''); setEndDate(''); setLocationOrLink('')
    setIsFree(true); setPrice(0); setEarlyBirdPrice(0); setEarlyBirdDeadline('')
    setEnableEarlyBird(false); setRefundPolicy('full'); setRefundDeadlineDays(3)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => { const u = prev.filter(e => e.id !== eventId); saveEvents(u); return u })
    setAttendees(prev => { const u = prev.filter(a => a.eventId !== eventId); saveAttendees(u); return u })
    toast.success('Event deleted')
  }

  const handleCancelEvent = (eventId: string) => {
    setEvents(prev => {
      const u = prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' as const, cancellationReason: 'Cancelled by organizer' } : e)
      saveEvents(u)
      return u
    })
    toast.success('Event cancelled. Attendees are eligible for refunds.')
  }

  // ── Register / Pay ────────────────────────────────────────────────────
  const handleRegister = (event: HirexEvent) => {
    if (!user) return
    if (event.status === 'cancelled') { toast.error('This event has been cancelled'); return }
    if (attendees.some(a => a.eventId === event.id && a.userId === user.id)) {
      toast.error('You are already registered for this event.')
      return
    }
    const spotsUsed = attendees.filter(a => a.eventId === event.id && a.paymentStatus !== 'refunded').length
    if (spotsUsed >= event.maxAttendees) {
      toast.error('Event is fully booked!')
      return
    }

    const effectivePrice = getEffectivePrice(event)

    if (effectivePrice === 0) {
      // Free registration
      const att: EventAttendee = {
        id: 'att-' + Date.now(),
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userFaceImage: user.faceImage,
        paymentStatus: 'free',
        amountPaid: 0,
        registeredAt: new Date().toISOString(),
        ticketCode: generateTicketCode(),
      }
      setAttendees(prev => { const u = [...prev, att]; saveAttendees(u); return u })
      toast.success('Successfully registered! Your ticket code: ' + att.ticketCode)
      return
    }

    // ── Razorpay Payment ────────────────────────────────────────────
    if (!isRazorpayLoaded) { toast.error('Payment gateway is loading...'); return }
    setProcessingPaymentId(event.id)

    const platformFee = Math.round(effectivePrice * PLATFORM_FEE / 100)
    const totalAmount = effectivePrice + platformFee

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: totalAmount * 100, // paise
      currency: 'INR',
      name: 'Hirex Events',
      description: 'Ticket: ' + event.title,
      image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      handler: function (response: any) {
        const att: EventAttendee = {
          id: 'att-' + Date.now(),
          eventId: event.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userFaceImage: user.faceImage,
          paymentStatus: 'paid',
          paymentId: response.razorpay_payment_id,
          amountPaid: totalAmount,
          registeredAt: new Date().toISOString(),
          ticketCode: generateTicketCode(),
        }
        setAttendees(prev => { const u = [...prev, att]; saveAttendees(u); return u })
        setProcessingPaymentId(null)
        toast.success('Payment successful! Ticket: ' + att.ticketCode, { duration: 5000 })
      },
      prefill: { name: user.name, email: user.email, contact: '' },
      notes: {
        eventId: event.id,
        eventTitle: event.title,
        ticketPrice: String(effectivePrice),
        platformFee: String(platformFee),
        organizerName: event.creatorName,
      },
      theme: { color: '#3B6FD8' },
      modal: {
        ondismiss: function () {
          setProcessingPaymentId(null)
          toast.error('Payment cancelled')
        },
        confirm_close: true,
        escape: false,
      },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.on('payment.failed', function (res: any) {
      toast.error('Payment failed: ' + (res?.error?.description || 'Unknown error'))
      setProcessingPaymentId(null)
    })
    rzp.open()
  }

  // ── Refund ────────────────────────────────────────────────────────────
  const handleRefund = (attendeeId: string) => {
    setAttendees(prev => {
      const u = prev.map(a => a.id === attendeeId ? { ...a, paymentStatus: 'refunded' as const } : a)
      saveAttendees(u)
      return u
    })
    toast.success('Refund processed')
  }

  // ── Render Helpers ────────────────────────────────────────────────────
  const activeEvents = events.filter(e => e.status === 'active')
  const filteredEvents = activeEvents.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const myEvents = events.filter(e => e.creatorId === user?.id)

  const tabs = [
    { key: 'browse', label: 'Browse Events', icon: Search, count: filteredEvents.length },
    { key: 'my-events', label: 'My Events', icon: Calendar, count: myEvents.length },
  ] as const

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="nexus-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' }}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Professional Events
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Discover, host, and attend verified professional events with secure payments
            </p>
          </div>
          <button onClick={() => { setShowPostForm(!showPostForm); setTab('browse') }}
            className="nexus-btn flex items-center gap-2 text-sm font-medium px-5 py-2.5"
            style={{
              background: showPostForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#3B6FD8,#8B5CF6)',
              color: showPostForm ? '#EF4444' : '#fff',
              border: showPostForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
              borderRadius: '12px',
            }}>
            {showPostForm ? <><X className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> Create Event</>}
          </button>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
            <input type="text" placeholder="Search events by title, category, or host..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="nexus-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: tab === t.key ? 'rgba(59,111,216,0.15)' : 'transparent',
                color: tab === t.key ? '#3B6FD8' : 'var(--text-secondary)',
                border: tab === t.key ? '1px solid rgba(59,111,216,0.3)' : '1px solid transparent',
              }}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: tab === t.key ? 'rgba(59,111,216,0.2)' : '#333', color: tab === t.key ? '#3B6FD8' : '#888' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ CREATE EVENT FORM ═══════════════════ */}
      {showPostForm && (
        <div className="nexus-card p-6 space-y-5" style={{ border: '1px solid rgba(59,111,216,0.2)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="h-5 w-5" style={{ color: '#3B6FD8' }} /> Create a New Event
          </h2>

          {/* Basic Info */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Event Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. React India Summit 2026" className="nexus-input w-full py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe what attendees will learn, agenda, speakers..."
              className="nexus-input w-full py-2.5 text-sm min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="nexus-input w-full py-2.5 text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {['Workshop', 'Conference', 'Meetup', 'Webinar', 'Hackathon', 'Networking', 'Panel Discussion'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value as 'Virtual' | 'In-person')}
                className="nexus-input w-full py-2.5 text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="Virtual">Virtual</option>
                <option value="In-person">In-person</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Start Date & Time *</label>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                className="nexus-input w-full py-2.5 text-sm" style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>End Date & Time</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="nexus-input w-full py-2.5 text-sm" style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Max Attendees</label>
              <input type="number" min="1" value={maxAttendees} onChange={e => setMaxAttendees(parseInt(e.target.value) || 100)}
                className="nexus-input w-full py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                {format === 'Virtual' ? 'Meeting Link' : 'Venue Address'}
              </label>
              <input type="text" value={locationOrLink} onChange={e => setLocationOrLink(e.target.value)}
                placeholder={format === 'Virtual' ? 'https://meet.google.com/...' : '123 Main St, Tech Park, Pune'}
                className="nexus-input w-full py-2.5 text-sm" />
            </div>
          </div>

          {/* ══ PRICING & FEES SECTION ══ */}
          <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CreditCard className="h-4 w-4" style={{ color: '#10B981' }} /> Pricing & Fees
            </h3>

            {/* Free / Paid Toggle */}
            <div className="flex gap-3">
              <button onClick={() => { setIsFree(true); setPrice(0); setEnableEarlyBird(false) }}
                className="flex-1 p-4 rounded-xl text-center transition-all"
                style={{
                  backgroundColor: isFree ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: isFree ? '2px solid #10B981' : '1px solid var(--border-default)',
                  color: isFree ? '#10B981' : 'var(--text-secondary)',
                }}>
                <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                <p className="font-bold text-sm">Free Event</p>
                <p className="text-[10px] mt-0.5">No payment required</p>
              </button>
              <button onClick={() => setIsFree(false)}
                className="flex-1 p-4 rounded-xl text-center transition-all"
                style={{
                  backgroundColor: !isFree ? 'rgba(59,111,216,0.1)' : 'transparent',
                  border: !isFree ? '2px solid #3B6FD8' : '1px solid var(--border-default)',
                  color: !isFree ? '#3B6FD8' : 'var(--text-secondary)',
                }}>
                <IndianRupee className="h-6 w-6 mx-auto mb-1" />
                <p className="font-bold text-sm">Paid Event</p>
                <p className="text-[10px] mt-0.5">Razorpay checkout</p>
              </button>
            </div>

            {/* Paid Event Fields */}
            {!isFree && (
              <div className="space-y-4 pt-2">
                {/* Ticket Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                      Ticket Price (INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#10B981' }}>₹</span>
                      <input type="number" min="1" value={price || ''} onChange={e => setPrice(parseInt(e.target.value) || 0)}
                        placeholder="500" className="nexus-input w-full py-2.5 pl-8 text-sm" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Price Breakdown</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Ticket Price</span><span style={{ color: 'var(--text-primary)' }}>₹{price || 0}</span></div>
                      <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Platform Fee ({PLATFORM_FEE}%)</span><span style={{ color: '#F59E0B' }}>₹{Math.round((price || 0) * PLATFORM_FEE / 100)}</span></div>
                      <div className="flex justify-between pt-1 border-t font-bold" style={{ borderColor: 'var(--border-default)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Attendee Pays</span>
                        <span style={{ color: '#10B981' }}>₹{(price || 0) + Math.round((price || 0) * PLATFORM_FEE / 100)}</span>
                      </div>
                      <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>You Receive</span><span style={{ color: '#3B6FD8' }}>₹{price || 0}</span></div>
                    </div>
                  </div>
                </div>

                {/* Early Bird */}
                <div className="p-4 rounded-xl" style={{ border: '1px dashed var(--border-default)', backgroundColor: enableEarlyBird ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={enableEarlyBird} onChange={e => setEnableEarlyBird(e.target.checked)}
                      className="w-4 h-4 rounded" />
                    <Tag className="h-4 w-4" style={{ color: '#F59E0B' }} />
                    Enable Early Bird Discount
                  </label>
                  {enableEarlyBird && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: 'var(--text-secondary)' }}>Discounted Price (INR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#F59E0B' }}>₹</span>
                          <input type="number" min="1" value={earlyBirdPrice || ''} onChange={e => setEarlyBirdPrice(parseInt(e.target.value) || 0)}
                            placeholder="299" className="nexus-input w-full py-2 pl-8 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: 'var(--text-secondary)' }}>Offer Valid Until</label>
                        <input type="datetime-local" value={earlyBirdDeadline} onChange={e => setEarlyBirdDeadline(e.target.value)}
                          className="nexus-input w-full py-2 text-sm" style={{ colorScheme: 'dark' }} />
                      </div>
                      {earlyBirdPrice > 0 && price > 0 && (
                        <p className="text-xs col-span-2" style={{ color: '#F59E0B' }}>
                          <Percent className="h-3 w-3 inline mr-1" />
                          {Math.round((1 - earlyBirdPrice / price) * 100)}% discount — attendees save ₹{price - earlyBirdPrice}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Refund Policy */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refund & Cancellation Policy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { val: 'full', label: 'Full Refund', desc: '100% refund if cancelled before deadline', color: '#10B981' },
                      { val: 'partial', label: 'Partial Refund', desc: '50% refund before deadline', color: '#F59E0B' },
                      { val: 'none', label: 'No Refunds', desc: 'All sales are final', color: '#EF4444' },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setRefundPolicy(opt.val)}
                        className="p-3 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: refundPolicy === opt.val ? opt.color + '15' : 'transparent',
                          border: refundPolicy === opt.val ? '2px solid ' + opt.color : '1px solid var(--border-default)',
                        }}>
                        <p className="text-xs font-bold" style={{ color: refundPolicy === opt.val ? opt.color : 'var(--text-primary)' }}>{opt.label}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {refundPolicy !== 'none' && (
                    <div className="flex items-center gap-2 mt-3">
                      <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Refund available if cancelled at least</label>
                      <input type="number" min="1" max="30" value={refundDeadlineDays}
                        onChange={e => setRefundDeadlineDays(parseInt(e.target.value) || 3)}
                        className="nexus-input w-16 py-1 text-sm text-center" />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>days before event</span>
                    </div>
                  )}
                </div>

                {/* Trust & Security Info */}
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,111,216,0.05)', border: '1px solid rgba(59,111,216,0.15)' }}>
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#3B6FD8' }} />
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p className="font-semibold mb-1" style={{ color: '#3B6FD8' }}>Secure Payments via Razorpay</p>
                    <p>All payments are processed through Razorpay's PCI-DSS compliant gateway. Funds are held securely and a {PLATFORM_FEE}% platform fee applies. Your attendees' payment data is never stored on our servers.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={resetForm} className="nexus-btn text-xs px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1 inline" /> Reset Form
            </button>
            <button onClick={handleCreateEvent}
              className="nexus-btn flex items-center gap-2 text-sm font-semibold px-6 py-3"
              style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)', color: '#fff', borderRadius: '12px', border: 'none' }}>
              <Calendar className="h-4 w-4" /> Publish Event
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ BROWSE EVENTS ═══════════════════ */}
      {tab === 'browse' && (
        filteredEvents.length === 0 ? (
          <div className="nexus-card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(59,111,216,0.1)' }}>
              <Calendar className="h-8 w-8" style={{ color: '#3B6FD8' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? 'No Events Found' : 'No Upcoming Events'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'Try different keywords' : 'Be the first to create and host an event!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEvents.map(event => {
              const eventAttendees = attendees.filter(a => a.eventId === event.id && a.paymentStatus !== 'refunded')
              const hasJoined = attendees.some(a => a.eventId === event.id && a.userId === user?.id && a.paymentStatus !== 'refunded')
              const isOwner = event.creatorId === user?.id
              const isFull = eventAttendees.length >= event.maxAttendees
              const effectivePrice = getEffectivePrice(event)
              const isEarlyBird = event.earlyBirdPrice > 0 && event.earlyBirdDeadline && new Date() < new Date(event.earlyBirdDeadline)
              const totalWithFee = effectivePrice > 0 ? effectivePrice + Math.round(effectivePrice * PLATFORM_FEE / 100) : 0

              return (
                <div key={event.id} className="nexus-card flex flex-col h-full overflow-hidden transition-all hover:shadow-lg">
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex gap-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{event.category}</span>
                          {isEarlyBird && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse"
                              style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Early Bird</span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          Hosted by <strong style={{ color: 'var(--text-primary)' }}>{event.creatorName}</strong>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {event.price === 0 ? (
                          <span className="block text-lg font-bold" style={{ color: '#3B6FD8' }}>FREE</span>
                        ) : (
                          <div>
                            {isEarlyBird && (
                              <span className="block text-xs line-through" style={{ color: '#666' }}>
                                {'₹' + (event.price + Math.round(event.price * PLATFORM_FEE / 100))}
                              </span>
                            )}
                            <span className="block text-lg font-bold" style={{ color: '#10B981' }}>
                              {'₹' + totalWithFee}
                            </span>
                            <span className="text-[9px]" style={{ color: '#888' }}>incl. {PLATFORM_FEE}% fee</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3 flex-grow">
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" /> {new Date(event.date).toLocaleString()}
                      </p>
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        {event.format === 'Virtual' ? <Video className="h-3.5 w-3.5 flex-shrink-0" /> : <MapPin className="h-3.5 w-3.5 flex-shrink-0" />}
                        {event.format}
                        {hasJoined && event.locationOrLink && (
                          <span className="text-blue-400 italic text-[10px] truncate ml-1"><ExternalLink className="h-3 w-3 inline mr-0.5" />{event.locationOrLink}</span>
                        )}
                      </p>
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Users className="h-3.5 w-3.5 flex-shrink-0" /> {eventAttendees.length} / {event.maxAttendees}
                      </p>
                      {event.refundPolicy !== 'none' && event.price > 0 && (
                        <p className="text-xs flex items-center gap-2" style={{ color: '#10B981' }}>
                          <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
                          {event.refundPolicy === 'full' ? 'Full' : '50%'} refund up to {event.refundDeadlineDays}d before
                        </p>
                      )}
                      <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {event.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                      {isOwner ? (
                        <button className="nexus-btn w-full text-sm py-2" style={{ backgroundColor: 'rgba(59,111,216,0.1)', color: '#3B6FD8' }}
                          onClick={() => setTab('my-events')}>Manage Event</button>
                      ) : hasJoined ? (
                        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <Ticket className="h-4 w-4" /> Ticket Confirmed
                        </div>
                      ) : isFull ? (
                        <div className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Sold Out</div>
                      ) : (
                        <button onClick={() => handleRegister(event)}
                          disabled={processingPaymentId === event.id}
                          className="nexus-btn flex items-center justify-center gap-2 text-sm font-medium w-full py-2.5"
                          style={{
                            background: effectivePrice > 0 ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#3B6FD8,#8B5CF6)',
                            color: '#fff', border: 'none', borderRadius: '12px',
                          }}>
                          {processingPaymentId === event.id ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                          ) : effectivePrice > 0 ? (
                            <><CreditCard className="h-4 w-4" /> Pay {'₹' + totalWithFee} & Register</>
                          ) : (
                            <><CheckCircle className="h-4 w-4" /> Register Free</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ═══════════════════ MY EVENTS (ORGANIZER DASHBOARD) ═══════════════════ */}
      {tab === 'my-events' && (
        myEvents.length === 0 ? (
          <div className="nexus-card p-12 text-center">
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Events Hosted</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first event!</p>
            <button onClick={() => { setShowPostForm(true); setTab('browse') }}
              className="nexus-btn text-sm" style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)', color: '#fff', border: 'none' }}>
              <Plus className="h-4 w-4 mr-1 inline" /> Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {myEvents.map(event => {
              const eventApps = attendees.filter(a => a.eventId === event.id)
              const paidApps = eventApps.filter(a => a.paymentStatus === 'paid')
              const refundedApps = eventApps.filter(a => a.paymentStatus === 'refunded')
              const activeApps = eventApps.filter(a => a.paymentStatus !== 'refunded')
              const totalRevenue = paidApps.reduce((s, a) => s + a.amountPaid, 0)
              const netRevenue = paidApps.length * event.price // after platform fee
              const isExpanded = expandedEventId === event.id
              const isCancelled = event.status === 'cancelled'

              return (
                <div key={event.id} className="nexus-card overflow-hidden" style={{ opacity: isCancelled ? 0.6 : 1 }}>
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    style={{ backgroundColor: isExpanded ? 'rgba(59,111,216,0.03)' : 'transparent' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
                        {isCancelled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Cancelled</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {activeApps.length} / {event.maxAttendees}</span>
                        {event.price > 0 && (
                          <>
                            <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                              <DollarSign className="h-3 w-3" /> {'₹' + netRevenue} net revenue
                            </span>
                            <span className="flex items-center gap-1" style={{ color: '#F59E0B' }}>
                              <Receipt className="h-3 w-3" /> {'₹' + totalRevenue} collected
                            </span>
                            {refundedApps.length > 0 && (
                              <span className="flex items-center gap-1" style={{ color: '#EF4444' }}>
                                <RefreshCw className="h-3 w-3" /> {refundedApps.length} refunded
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="nexus-btn text-sm py-2 px-4 flex items-center gap-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                        {isExpanded ? 'Hide' : 'Attendees'} {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {!isCancelled && (
                        <button onClick={() => handleCancelEvent(event.id)}
                          className="p-2 rounded-xl" style={{ border: '1px solid rgba(239,68,68,0.2)' }} title="Cancel Event">
                          <AlertTriangle className="h-4 w-4" style={{ color: '#EF4444' }} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 rounded-xl" style={{ border: '1px solid var(--border-default)' }} title="Delete Event">
                        <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="divide-y border-t" style={{ borderColor: 'var(--border-default)' }}>
                      {eventApps.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No attendees yet.</div>
                      ) : (
                        eventApps.map(app => {
                          const avatar = generateAvatar(app.userName)
                          const isRefunded = app.paymentStatus === 'refunded'
                          return (
                            <div key={app.id} className="p-4 flex items-center gap-4" style={{ opacity: isRefunded ? 0.5 : 1 }}>
                              {app.userFaceImage ? (
                                <img src={app.userFaceImage} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                              ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: 'var(--color-network)' }}>{avatar.initials}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{app.userName}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{app.userEmail}</p>
                                <p className="text-[10px] mt-0.5 font-mono" style={{ color: '#888' }}>
                                  Ticket: {app.ticketCode} • {new Date(app.registeredAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {app.paymentStatus === 'paid' ? (
                                  <div className="text-right">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                      style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                                      Paid {'₹' + app.amountPaid}
                                    </span>
                                    <p className="text-[9px] mt-0.5 font-mono" style={{ color: '#666' }}>{app.paymentId?.substring(0, 14)}</p>
                                  </div>
                                ) : app.paymentStatus === 'refunded' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Refunded</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                    style={{ backgroundColor: 'rgba(59,111,216,0.1)', color: '#3B6FD8' }}>Free</span>
                                )}
                                {app.paymentStatus === 'paid' && canRefund(event) && (
                                  <button onClick={() => handleRefund(app.id)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                                    style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    Refund
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

export default EventsPage