import React, { useState, useEffect } from 'react'
import {
  Users, Search, UserPlus, CheckCircle, XCircle, Shield,
  Loader2, MessageSquare, UserMinus, Clock, Briefcase, ArrowRight
} from 'lucide-react'
import { connectionApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { generateAvatar } from '@/lib/utils'
import toast from 'react-hot-toast'

interface NetworkUser {
  id: string
  name: string
  email: string
  role: string
  faceImage?: string
  verificationStatus?: { face: boolean }
  joinedAt?: string
  connectionStatus?: { status: string; connectionId?: string }
}

const ConnectionsPage: React.FC = () => {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'discover' | 'connections' | 'pending' | 'sent'>('discover')
  const [allUsers, setAllUsers] = useState<NetworkUser[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [usersRes, connsRes, pendingRes, sentRes] = await Promise.all([
        connectionApi.getUsers().catch(() => ({ data: { data: [] } })),
        connectionApi.getConnections().catch(() => ({ data: { data: [] } })),
        connectionApi.getPendingRequests().catch(() => ({ data: { data: [] } })),
        connectionApi.getSentRequests().catch(() => ({ data: { data: [] } })),
      ])
      setAllUsers(usersRes.data?.data || [])
      setConnections(connsRes.data?.data || [])
      setPendingRequests(pendingRes.data?.data || [])
      setSentRequests(sentRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load network data', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (userId: string) => {
    try {
      setConnectingIds(prev => new Set(prev).add(userId))
      await connectionApi.sendRequest(userId)
      toast.success('Connection request sent!')
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to send request')
    } finally {
      setConnectingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await connectionApi.respondToRequest(requestId, action)
      toast.success(action === 'accept' ? 'Connection accepted!' : 'Request declined')
      fetchData()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await connectionApi.removeConnection(userId)
      toast.success('Connection removed')
      fetchData()
    } catch (err) {
      toast.error('Failed to remove connection')
    }
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { key: 'discover', label: 'Discover', icon: Users, count: allUsers.length },
    { key: 'connections', label: 'Connected', icon: CheckCircle, count: connections.length },
    { key: 'pending', label: 'Received', icon: Clock, count: pendingRequests.length },
    { key: 'sent', label: 'Sent', icon: ArrowRight, count: sentRequests.length },
  ] as const

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="nexus-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' }}>
                <Users className="h-5 w-5 text-white" />
              </div>
              My Network
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Discover and connect with professionals on the platform
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
            <input type="text" placeholder="Search people..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="nexus-input pl-10 pr-4 py-2.5 text-sm" style={{ width: '280px' }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: tab === t.key ? 'rgba(59,111,216,0.15)' : 'transparent',
                color: tab === t.key ? 'var(--color-network)' : 'var(--text-secondary)',
                border: tab === t.key ? '1px solid rgba(59,111,216,0.3)' : '1px solid transparent',
              }}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: tab === t.key ? 'rgba(59,111,216,0.2)' : '#333', color: tab === t.key ? 'var(--color-network)' : '#888' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="nexus-card p-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-network)' }} />
        </div>
      ) : (
        <>
          {/* ═══ Discover Tab ═══ */}
          {tab === 'discover' && (
            filteredUsers.length === 0 ? (
              <div className="nexus-card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(59,111,216,0.1)' }}>
                  <Users className="h-8 w-8" style={{ color: 'var(--color-network)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {searchQuery ? 'No Results' : 'No Users Yet'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {searchQuery ? 'Try a different search term' : 'Be the first to invite others! Users who sign up will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map(u => {
                  const avatar = generateAvatar(u.name)
                  const status = u.connectionStatus?.status || 'none'
                  const isConnecting = connectingIds.has(u.id)
                  return (
                    <div key={u.id} className="nexus-card p-5 transition-all hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        {u.faceImage ? (
                          <img src={u.faceImage} alt={u.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2"
                            style={{ borderColor: u.verificationStatus?.face ? '#10B981' : '#333' }} />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: 'var(--color-network)' }}>
                            {avatar.initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                              {u.name}
                            </h3>
                            {u.verificationStatus?.face && (
                              <Shield className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#10B981' }} />
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {u.email}
                          </p>
                          <p className="text-xs capitalize mt-0.5 font-medium" style={{ color: 'var(--color-network)' }}>
                            {u.role}
                          </p>
                        </div>
                      </div>

                      {status === 'none' ? (
                        <button onClick={() => handleConnect(u.id)} disabled={isConnecting}
                          className="w-full nexus-btn flex items-center justify-center gap-2 text-sm font-medium py-2.5"
                          style={{
                            backgroundColor: 'rgba(59,111,216,0.1)',
                            color: 'var(--color-network)',
                            border: '1px solid rgba(59,111,216,0.3)',
                            borderRadius: '12px',
                          }}>
                          {isConnecting ?
                            <Loader2 className="h-4 w-4 animate-spin" /> :
                            <><UserPlus className="h-4 w-4" /> Connect</>}
                        </button>
                      ) : status === 'sent' ? (
                        <div className="w-full text-center py-2.5 text-sm font-medium rounded-xl"
                          style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <Clock className="h-4 w-4 inline mr-1" /> Pending
                        </div>
                      ) : status === 'connected' ? (
                        <div className="w-full text-center py-2.5 text-sm font-medium rounded-xl"
                          style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle className="h-4 w-4 inline mr-1" /> Connected
                        </div>
                      ) : status === 'received' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleRespond(u.connectionStatus?.connectionId!, 'accept')}
                            className="flex-1 nexus-btn text-xs py-2" style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '10px' }}>
                            Accept
                          </button>
                          <button onClick={() => handleRespond(u.connectionStatus?.connectionId!, 'decline')}
                            className="flex-1 nexus-btn text-xs py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                            Decline
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ═══ Connections Tab ═══ */}
          {tab === 'connections' && (
            connections.length === 0 ? (
              <div className="nexus-card p-16 text-center">
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No Connections Yet
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Connect with professionals on the Discover tab
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((c: any) => {
                  const avatar = generateAvatar(c.user?.name || 'U')
                  return (
                    <div key={c._id} className="nexus-card p-4 flex items-center gap-4">
                      {c.user?.faceImage ? (
                        <img src={c.user.faceImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: 'var(--color-network)' }}>{avatar.initials}</div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.user?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.user?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="nexus-btn nexus-btn-outline text-xs px-3 py-1.5">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
                        </button>
                        <button onClick={() => handleRemove(c.user?.id)}
                          className="nexus-btn text-xs px-3 py-1.5"
                          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ═══ Pending Tab ═══ */}
          {tab === 'pending' && (
            pendingRequests.length === 0 ? (
              <div className="nexus-card p-12 text-center">
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No Pending Requests
                </h2>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req: any) => {
                  const avatar = generateAvatar(req.requester?.name || 'U')
                  return (
                    <div key={req._id} className="nexus-card p-4 flex items-center gap-4">
                      {req.requester?.faceImage ? (
                        <img src={req.requester.faceImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: 'var(--color-network)' }}>{avatar.initials}</div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{req.requester?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{req.message || req.requester?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(req._id, 'accept')}
                          className="nexus-btn text-xs px-4 py-2" style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '10px' }}>
                          Accept
                        </button>
                        <button onClick={() => handleRespond(req._id, 'decline')}
                          className="nexus-btn text-xs px-4 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ═══ Sent Tab ═══ */}
          {tab === 'sent' && (
            sentRequests.length === 0 ? (
              <div className="nexus-card p-12 text-center">
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No Sent Requests
                </h2>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((req: any) => {
                  const avatar = generateAvatar(req.recipient?.name || 'U')
                  return (
                    <div key={req._id} className="nexus-card p-4 flex items-center gap-4">
                      {req.recipient?.faceImage ? (
                        <img src={req.recipient.faceImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: 'var(--color-network)' }}>{avatar.initials}</div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{req.recipient?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{req.recipient?.email}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                        <Clock className="h-3 w-3 inline mr-1" /> Pending
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

export default ConnectionsPage