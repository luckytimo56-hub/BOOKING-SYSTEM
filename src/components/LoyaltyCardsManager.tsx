import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Edit3, 
  History, 
  Gift, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Copy, 
  Check, 
  FileText, 
  X,
  TrendingUp,
  Tag,
  Users
} from 'lucide-react';
import { 
  LoyaltyCard, 
  LoyaltyAuditTrail, 
  LoyaltyTier, 
  LoyaltyAuditAction 
} from '../types';
import { NUAT_THAI_BRANCHES } from '../data/initialData';

interface LoyaltyCardsManagerProps {
  selectedBranch?: string;
}

export const LoyaltyCardsManager: React.FC<LoyaltyCardsManagerProps> = ({
  selectedBranch = 'bgc'
}) => {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'audit_log'>('cards');
  
  // Selected Card for full detail view / modals
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showNewCardModal, setShowNewCardModal] = useState<boolean>(false);
  const [showQuickStampModal, setShowQuickStampModal] = useState<boolean>(false);
  const [showGrantRewardModal, setShowGrantRewardModal] = useState<boolean>(false);
  const [showRedeemRewardModal, setShowRedeemRewardModal] = useState<boolean>(false);
  
  // Quick stamp modal state
  const [stampDelta, setStampDelta] = useState<number>(1);
  const [quickStampReason, setQuickStampReason] = useState<string>('');
  const [adminSigner, setAdminSigner] = useState<string>('Karen Alcantara (Branch Supervisor)');
  const [adminRole, setAdminRole] = useState<string>('Branch Supervisor');
  const [adminBranch, setAdminBranch] = useState<string>('Nuat Thai BGC High Street');

  // Edit Card Form State
  const [editForm, setEditForm] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    tier: LoyaltyTier;
    stamps: number;
    points: number;
    status: 'active' | 'suspended' | 'expired';
    homeBranch: string;
    expiresAt: string;
    notes: string;
    reason: string;
  }>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tier: 'Classic',
    stamps: 0,
    points: 0,
    status: 'active',
    homeBranch: 'bgc',
    expiresAt: '',
    notes: '',
    reason: ''
  });

  // Grant Reward Form State
  const [grantRewardForm, setGrantRewardForm] = useState({
    name: 'Free 60m Authentic Thai Body Massage',
    description: 'Complimentary full session voucher',
    reason: 'VIP milestone award approved by branch manager'
  });

  // Redeem Reward Target
  const [targetRewardId, setTargetRewardId] = useState<string>('');
  const [redeemReason, setRedeemReason] = useState<string>('Customer present at front desk redeeming earned reward voucher.');

  // New Card Form State
  const [newCardForm, setNewCardForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tier: 'Classic' as LoyaltyTier,
    stamps: 1,
    points: 50,
    homeBranch: selectedBranch,
    notes: 'Enrolled via front desk reception.',
    reason: 'New customer registration and first session stamp issuance.'
  });

  // Master Audit Trail search & filters
  const [masterAuditTrails, setMasterAuditTrails] = useState<LoyaltyAuditTrail[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch cards
  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/loyalty-cards');
      if (res.ok) {
        const data = await res.json();
        setCards(data);
        if (selectedCard) {
          const refreshed = data.find((c: LoyaltyCard) => c.id === selectedCard.id);
          if (refreshed) setSelectedCard(refreshed);
        } else if (data.length > 0) {
          setSelectedCard(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch loyalty cards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch master audit trails
  const fetchMasterAuditTrails = async () => {
    try {
      const res = await fetch('/api/loyalty-audit-trails');
      if (res.ok) {
        const data = await res.json();
        setMasterAuditTrails(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit trails:', err);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchMasterAuditTrails();
  }, []);

  // Filtered cards
  const filteredCards = cards.filter(card => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      card.cardNumber.toLowerCase().includes(q) ||
      card.customerName.toLowerCase().includes(q) ||
      card.customerPhone.toLowerCase().includes(q) ||
      card.customerEmail.toLowerCase().includes(q);

    const matchesTier = tierFilter === 'all' || card.tier.toLowerCase() === tierFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || card.homeBranch === branchFilter;

    return matchesSearch && matchesTier && matchesStatus && matchesBranch;
  });

  // Filtered master audit trails
  const filteredAuditTrails = masterAuditTrails.filter(trail => {
    const q = auditSearch.toLowerCase().trim();
    const matchesQuery = !q ||
      trail.customerName.toLowerCase().includes(q) ||
      trail.cardNumber.toLowerCase().includes(q) ||
      trail.adminName.toLowerCase().includes(q) ||
      trail.reason.toLowerCase().includes(q) ||
      trail.fieldChanged.toLowerCase().includes(q);

    const matchesAction = auditActionFilter === 'all' || trail.action === auditActionFilter;

    return matchesQuery && matchesAction;
  });

  // Open Edit Modal and prepopulate
  const handleOpenEditModal = (card: LoyaltyCard) => {
    setSelectedCard(card);
    setEditForm({
      customerName: card.customerName,
      customerPhone: card.customerPhone,
      customerEmail: card.customerEmail || '',
      tier: card.tier,
      stamps: card.stamps,
      points: card.points,
      status: card.status,
      homeBranch: card.homeBranch,
      expiresAt: card.expiresAt ? card.expiresAt.split('T')[0] : '',
      notes: card.notes || '',
      reason: ''
    });
    setShowEditModal(true);
  };

  // Submit Edit Card
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    if (!editForm.reason.trim()) {
      showToast('Admin justification note is strictly required for the audit trail!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/loyalty-cards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editForm.customerName,
          customerPhone: editForm.customerPhone,
          customerEmail: editForm.customerEmail,
          tier: editForm.tier,
          stamps: editForm.stamps,
          points: editForm.points,
          status: editForm.status,
          homeBranch: editForm.homeBranch,
          expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt).toISOString() : selectedCard.expiresAt,
          notes: editForm.notes,
          adminName: adminSigner,
          adminRole: adminRole,
          branch: adminBranch,
          reason: editForm.reason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update card');
      }

      const updated = await res.json();
      showToast(`Loyalty card for ${updated.customerName} updated & audit trail logged!`);
      setShowEditModal(false);
      fetchCards();
      fetchMasterAuditTrails();
    } catch (err: any) {
      showToast(err.message || 'Error updating card', 'error');
    }
  };

  // Quick Stamp Action Submit
  const handleQuickStampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    if (!quickStampReason.trim()) {
      showToast('Please provide an admin reason for this stamp change.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/loyalty-cards/${selectedCard.id}/quick-stamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: stampDelta,
          adminName: adminSigner,
          adminRole: adminRole,
          branch: adminBranch,
          reason: quickStampReason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to adjust stamps');
      }

      const updated = await res.json();
      showToast(`${stampDelta > 0 ? '+' : ''}${stampDelta} stamp recorded for ${updated.customerName}. Audit trail updated!`);
      setShowQuickStampModal(false);
      setQuickStampReason('');
      fetchCards();
      fetchMasterAuditTrails();
    } catch (err: any) {
      showToast(err.message || 'Error adjusting stamps', 'error');
    }
  };

  // Submit Grant Reward
  const handleGrantRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    if (!grantRewardForm.reason.trim()) {
      showToast('Admin reason is required for granting reward', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/loyalty-cards/${selectedCard.id}/rewards/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: grantRewardForm.name,
          description: grantRewardForm.description,
          adminName: adminSigner,
          adminRole: adminRole,
          branch: adminBranch,
          reason: grantRewardForm.reason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to grant reward');
      }

      const updated = await res.json();
      showToast(`Reward "${grantRewardForm.name}" granted to ${updated.customerName}!`);
      setShowGrantRewardModal(false);
      fetchCards();
      fetchMasterAuditTrails();
    } catch (err: any) {
      showToast(err.message || 'Error granting reward', 'error');
    }
  };

  // Submit Redeem Reward
  const handleRedeemRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !targetRewardId) return;

    if (!redeemReason.trim()) {
      showToast('Admin reason is required for redemption', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/loyalty-cards/${selectedCard.id}/rewards/${targetRewardId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminSigner,
          adminRole: adminRole,
          branch: adminBranch,
          reason: redeemReason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to redeem reward');
      }

      showToast(`Reward redeemed successfully at front desk!`);
      setShowRedeemRewardModal(false);
      fetchCards();
      fetchMasterAuditTrails();
    } catch (err: any) {
      showToast(err.message || 'Error redeeming reward', 'error');
    }
  };

  // Submit New Card Issuance
  const handleIssueNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.customerName.trim() || !newCardForm.customerPhone.trim()) {
      showToast('Customer name and phone number are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/loyalty-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCardForm,
          adminName: adminSigner,
          adminRole: adminRole,
          branch: adminBranch
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to issue card');
      }

      const created = await res.json();
      showToast(`Digital Loyalty Card ${created.cardNumber} issued to ${created.customerName}!`);
      setShowNewCardModal(false);
      setSelectedCard(created);
      setNewCardForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        tier: 'Classic',
        stamps: 1,
        points: 50,
        homeBranch: selectedBranch,
        notes: 'Enrolled via front desk reception.',
        reason: 'New customer registration and first session stamp issuance.'
      });
      fetchCards();
      fetchMasterAuditTrails();
    } catch (err: any) {
      showToast(err.message || 'Error creating card', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action badge color helper
  const getActionBadge = (action: LoyaltyAuditAction) => {
    switch (action) {
      case 'STAMPS_ADDED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '+ Stamp Added' };
      case 'STAMPS_DEDUCTED':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '- Stamp Deducted' };
      case 'TIER_UPGRADED':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Tier Upgraded' };
      case 'REWARD_GRANTED':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Reward Granted' };
      case 'REWARD_REDEEMED':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Reward Redeemed' };
      case 'CARD_CREATED':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Card Issued' };
      case 'PROFILE_EDITED':
        return { bg: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Profile Edited' };
      case 'STATUS_CHANGED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Status Changed' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: action.replace(/_/g, ' ') };
    }
  };

  // Tier styling helper
  const getTierColor = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'Platinum Royal':
        return 'from-purple-950 via-[#2a135e] to-slate-900 border-purple-300/40 text-purple-200';
      case 'Gold VIP':
        return 'from-[#1e1045] via-[#2c1766] to-[#452110] border-yellow-400/50 text-yellow-300';
      case 'Silver Suki':
        return 'from-slate-900 via-[#1f2839] to-slate-800 border-slate-300/40 text-slate-200';
      default:
        return 'from-[#1e1045] via-[#241252] to-[#12092b] border-purple-500/30 text-purple-200';
    }
  };

  // KPIs
  const totalCards = cards.length;
  const totalStampsAwarded = cards.reduce((acc, c) => acc + c.stamps, 0);
  const totalAvailableRewards = cards.reduce((acc, c) => acc + c.rewards.filter(r => r.status === 'available').length, 0);
  const totalAuditEntries = masterAuditTrails.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition animate-bounce ${
          toastMessage.type === 'success' 
            ? 'bg-[#1e1045] text-[#F0D204] border-[#F0D204]/40' 
            : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#F0D204]" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#20124D] text-[#F0D204]">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif">
              Nuat Thai Suki &amp; Loyalty Cards
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Customer digital loyalty passes with 10-stamp rewards card, points balance, admin adjustment controls, and strict audit edit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="issue-new-card-btn"
            onClick={() => setShowNewCardModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#20124D] hover:bg-[#2c1868] text-[#F0D204] text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#F0D204]/40 hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Loyalty Card</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#20124D]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Members</span>
            <span className="text-xl font-bold text-slate-900">{totalCards}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Current Stamps</span>
            <span className="text-xl font-bold text-slate-900">{totalStampsAwarded}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Free Rewards</span>
            <span className="text-xl font-bold text-slate-900">{totalAvailableRewards}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Audit Trail Entries</span>
            <span className="text-xl font-bold text-slate-900">{totalAuditEntries}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation: Cards vs Master Audit Trail */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('cards')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-[#20124D] text-[#F0D204] shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Loyalty Cards Directory ({filteredCards.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('audit_log');
            fetchMasterAuditTrails();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit_log'
              ? 'bg-[#20124D] text-[#F0D204] shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Master Edit Trails &amp; Audit Log ({filteredAuditTrails.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: CARDS DIRECTORY & DIGITAL CARD VISUALIZER */}
      {/* ========================================================= */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, phone number, card number (e.g. NT-SUKI-88401)..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#20124D]/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Tiers</option>
                <option value="Classic">Classic</option>
                <option value="Silver Suki">Silver Suki</option>
                <option value="Gold VIP">Gold VIP</option>
                <option value="Platinum Royal">Platinum Royal</option>
              </select>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Branches</option>
                {NUAT_THAI_BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Cards Layout: Left List + Right Active Card Detailed Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Roster Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Member Profiles ({filteredCards.length})
                </span>
                <span className="text-[11px] text-slate-400">Click to view &amp; edit</span>
              </div>

              {filteredCards.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                  <Award className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No loyalty cards match your criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setTierFilter('all'); setStatusFilter('all'); setBranchFilter('all'); }}
                    className="text-xs font-bold text-[#20124D] hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
                  {filteredCards.map(card => {
                    const isSelected = selectedCard?.id === card.id;
                    const availableRewardsCount = card.rewards.filter(r => r.status === 'available').length;

                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#f7f4ff] border-[#20124D] shadow-sm ring-1 ring-[#20124D]'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{card.customerName}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                                card.tier === 'Platinum Royal' ? 'bg-purple-100 text-purple-800' :
                                card.tier === 'Gold VIP' ? 'bg-amber-100 text-amber-800' :
                                card.tier === 'Silver Suki' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {card.tier}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                              {card.cardNumber} • {card.customerPhone}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-[#20124D]">
                              {card.stamps} / {card.stampsTarget}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Stamps</span>
                          </div>
                        </div>

                        {/* Stamp Mini Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#20124D] h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (card.stamps / card.stampsTarget) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Badges / Footer */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            ₱{card.lifetimeSpend.toLocaleString()} spend • {card.points} pts
                          </span>
                          {availableRewardsCount > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {availableRewardsCount} Free Reward{availableRewardsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Active Card Detailed Workspace (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedCard ? (
                <>
                  {/* Digital Card Canvas */}
                  <div className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${getTierColor(selectedCard.tier)} text-white shadow-xl border overflow-hidden`}>
                    {/* Background Nuat Thai watermark pattern */}
                    <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none text-yellow-300">
                      <Award className="w-56 h-56" />
                    </div>

                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F0D204] text-[#20124D] flex items-center justify-center font-black text-xl shadow-md border border-yellow-200">
                          NT
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-extrabold tracking-wider font-serif text-[#F0D204] uppercase">
                              NUAT THAI
                            </h2>
                            <span className="px-2 py-0.5 bg-white/15 text-white text-[10px] font-bold rounded uppercase tracking-wider backdrop-blur-xs">
                              {selectedCard.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-200/90 font-medium">
                            AUTHENTIC THAI MASSAGE &bull; SUKI LOYALTY PASS
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        selectedCard.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                      }`}>
                        {selectedCard.status}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10 border-t border-white/10 pt-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-yellow-300/80 tracking-widest block">
                          Cardholder Name
                        </span>
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block">
                          {selectedCard.customerName}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-purple-200 mt-1">
                          <span>{selectedCard.customerPhone}</span>
                          <span>&bull;</span>
                          <span>{selectedCard.homeBranch.toUpperCase()} Branch</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-yellow-300/80 tracking-widest block">
                          Card Number
                        </span>
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <span className="font-mono text-sm sm:text-base font-bold text-yellow-300 tracking-wider">
                            {selectedCard.cardNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedCard.cardNumber, selectedCard.id)}
                            className="p-1 hover:bg-white/15 rounded text-yellow-200 transition cursor-pointer"
                            title="Copy Card Number"
                          >
                            {copiedId === selectedCard.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 10-Stamp Stamp Grid */}
                    <div className="mt-6 bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 relative z-10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-yellow-300">
                          <Sparkles className="w-4 h-4 text-[#F0D204]" />
                          <span>Nuat Thai 10-Stamp Rewards Card</span>
                        </div>
                        <span className="font-mono font-bold text-white text-xs">
                          {selectedCard.stamps} of {selectedCard.stampsTarget} Stamps
                        </span>
                      </div>

                      {/* Visual Slots (1 to 10) */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                        {Array.from({ length: 10 }).map((_, index) => {
                          const slotNumber = index + 1;
                          const isStamped = slotNumber <= selectedCard.stamps;
                          const isMilestone = slotNumber === 10;

                          return (
                            <div
                              key={slotNumber}
                              className={`h-12 rounded-xl flex flex-col items-center justify-center transition relative ${
                                isStamped
                                  ? 'bg-[#F0D204] text-[#20124D] shadow-md font-bold scale-100 border border-yellow-200'
                                  : isMilestone
                                  ? 'bg-purple-900/60 border-2 border-dashed border-[#F0D204] text-yellow-300 animate-pulse'
                                  : 'bg-white/5 border border-dashed border-white/20 text-white/50'
                              }`}
                            >
                              {isStamped ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase mt-0.5">#{slotNumber}</span>
                                </>
                              ) : isMilestone ? (
                                <>
                                  <Gift className="w-4 h-4 text-[#F0D204]" />
                                  <span className="text-[8px] font-black uppercase mt-0.5">FREE</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[11px] font-bold text-white/40">{slotNumber}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-purple-200/90 pt-1">
                        <span>Every 10th session earns a <strong>FREE 60m Thai Body Massage</strong></span>
                        <span className="font-bold text-[#F0D204]">
                          {selectedCard.stamps >= 10 
                            ? 'Milestone achieved!' 
                            : `${10 - selectedCard.stamps} more to free session`}
                        </span>
                      </div>
                    </div>

                    {/* Bottom metrics row */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-100 relative z-10">
                      <div className="flex items-center gap-4">
                        <span><strong>{selectedCard.points}</strong> Points</span>
                        <span>&bull;</span>
                        <span><strong>{selectedCard.totalVisits}</strong> Visits</span>
                        <span>&bull;</span>
                        <span><strong>₱{selectedCard.lifetimeSpend.toLocaleString()}</strong> Lifetime Spend</span>
                      </div>
                      <div className="text-[11px] text-purple-300">
                        Expires: {new Date(selectedCard.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Admin Action Control Panel */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#20124D]" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          Admin Operations &amp; Adjustments
                        </h3>
                      </div>
                      <span className="text-[11px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                        Mandatory Audit Trail Enabled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        id="quick-add-stamp-btn"
                        onClick={() => {
                          setStampDelta(1);
                          setQuickStampReason('Walk-in massage completed at front desk.');
                          setShowQuickStampModal(true);
                        }}
                        className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>+1 Stamp</span>
                      </button>

                      <button
                        id="quick-deduct-stamp-btn"
                        onClick={() => {
                          setStampDelta(-1);
                          setQuickStampReason('Correction of duplicate stamp entry.');
                          setShowQuickStampModal(true);
                        }}
                        className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>-1 Stamp</span>
                      </button>

                      <button
                        id="grant-reward-btn"
                        onClick={() => setShowGrantRewardModal(true)}
                        className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Gift className="w-4 h-4 text-purple-600" />
                        <span>Grant Reward</span>
                      </button>

                      <button
                        id="edit-loyalty-card-btn"
                        onClick={() => handleOpenEditModal(selectedCard)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-slate-600" />
                        <span>Edit Full Card</span>
                      </button>
                    </div>

                    {/* Available Rewards on Card */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Rewards &amp; Vouchers ({selectedCard.rewards.length})</span>
                        </span>
                      </div>

                      {selectedCard.rewards.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No rewards currently active. Client earns Free Massage at 10 stamps.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedCard.rewards.map(reward => (
                            <div
                              key={reward.id}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                reward.status === 'available'
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : 'bg-slate-50 border-slate-200 opacity-70'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{reward.name}</span>
                                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase ${
                                    reward.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {reward.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{reward.description}</p>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Earned {new Date(reward.earnedAt).toLocaleDateString()}
                                  {reward.redeemedAt && ` • Redeemed ${new Date(reward.redeemedAt).toLocaleDateString()} (${reward.redeemedByAdmin})`}
                                </span>
                              </div>

                              {reward.status === 'available' && (
                                <button
                                  onClick={() => {
                                    setTargetRewardId(reward.id);
                                    setShowRedeemRewardModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
                                >
                                  Redeem Voucher
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Edit Trails / Audit History Component */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#20124D]" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          Edit Trails &amp; Change History ({selectedCard.auditTrail.length})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {selectedCard.cardNumber}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {selectedCard.auditTrail.map((trail, i) => {
                        const badge = getActionBadge(trail.action);

                        return (
                          <div
                            key={trail.id || i}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <span className="font-semibold text-slate-800">{trail.fieldChanged}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                                {new Date(trail.timestamp).toLocaleString()}
                              </span>
                            </div>

                            {/* Diff */}
                            <div className="flex items-center gap-2 text-xs font-mono bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 line-through truncate max-w-[45%]">
                                {trail.previousValue}
                              </span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-[#20124D] font-bold truncate max-w-[45%]">
                                {trail.newValue}
                              </span>
                            </div>

                            {/* Mandatory Admin Reason Callout */}
                            <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-100/80">
                              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                                Admin Reason &bull; {trail.adminName} ({trail.adminRole})
                              </span>
                              <p className="text-xs text-purple-950 font-medium mt-0.5 italic">
                                &ldquo;{trail.reason}&rdquo;
                              </p>
                              <span className="text-[10px] text-purple-600 block mt-1 font-sans">
                                Location: {trail.branch}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-700">Select a Loyalty Card</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a card from the left directory to preview digital pass, add stamps, edit member perks, and review complete edit trails.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: MASTER EDIT TRAILS & AUDIT LOG */}
      {/* ========================================================= */}
      {activeSubTab === 'audit_log' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#20124D]" />
                <span>Master Admin Edit Trails &amp; Modification Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete, immutable audit log of all stamp additions, tier upgrades, reward redemptions, and manual corrections across all loyalty cards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {filteredAuditTrails.length} Recorded Events
              </span>
            </div>
          </div>

          {/* Audit Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by admin name, customer, card #, or reason..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#20124D]/30"
              />
            </div>

            <select
              value={auditActionFilter}
              onChange={e => setAuditActionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden w-full sm:w-auto"
            >
              <option value="all">All Action Types</option>
              <option value="STAMPS_ADDED">Stamps Added</option>
              <option value="STAMPS_DEDUCTED">Stamps Deducted</option>
              <option value="TIER_UPGRADED">Tier Upgraded</option>
              <option value="REWARD_GRANTED">Reward Granted</option>
              <option value="REWARD_REDEEMED">Reward Redeemed</option>
              <option value="CARD_CREATED">Card Created</option>
              <option value="PROFILE_EDITED">Profile Edited</option>
              <option value="STATUS_CHANGED">Status Changed</option>
            </select>
          </div>

          {/* Master Audit Trails Feed */}
          {filteredAuditTrails.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit trail records found matching your query.
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredAuditTrails.map(trail => {
                const badge = getActionBadge(trail.action);

                return (
                  <div
                    key={trail.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:bg-slate-50 transition text-xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="font-bold text-slate-900">{trail.customerName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">({trail.cardNumber})</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-slate-600 font-semibold">{trail.fieldChanged}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(trail.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 line-through">{trail.previousValue}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="text-[#20124D] font-bold">{trail.newValue}</span>
                    </div>

                    <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                          Admin Reason &bull; Logged by {trail.adminName} ({trail.adminRole})
                        </span>
                        <p className="text-xs text-purple-950 font-medium mt-0.5 italic">
                          &ldquo;{trail.reason}&rdquo;
                        </p>
                      </div>
                      <span className="text-[11px] text-purple-700 font-medium shrink-0">
                        {trail.branch}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT CARD (ADMIN) WITH MANDATORY AUDIT TRAIL */}
      {/* ========================================================= */}
      {showEditModal && selectedCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#1e1045] p-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#F0D204]" />
                  <h3 className="font-bold text-lg text-white">Edit Loyalty Card (Admin)</h3>
                </div>
                <p className="text-xs text-purple-200 mt-0.5">
                  Modifications are recorded immutably with admin justification notes.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full hover:bg-white/15 text-white/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#20124D]/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={editForm.customerPhone}
                    onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#20124D]/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stamps Count (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editForm.stamps}
                    onChange={e => setEditForm({ ...editForm, stamps: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Target: 10 stamps = Free Massage</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Points Balance</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.points}
                    onChange={e => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Membership Tier</label>
                  <select
                    value={editForm.tier}
                    onChange={e => setEditForm({ ...editForm, tier: e.target.value as LoyaltyTier })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Silver Suki">Silver Suki</option>
                    <option value="Gold VIP">Gold VIP</option>
                    <option value="Platinum Royal">Platinum Royal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Branch</label>
                  <select
                    value={editForm.homeBranch}
                    onChange={e => setEditForm({ ...editForm, homeBranch: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {NUAT_THAI_BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Reception Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="e.g. Prefers female therapist for foot reflexology"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* MANDATORY AUDIT TRAIL REASON SECTION */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-[#20124D] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mandatory Admin Audit Justification</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  You must state the operational reason for this modification. This will be logged in the permanent audit trail.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reason / Justification <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.reason}
                    onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                    placeholder="e.g. Walk-in session credited after receipt verification; customer upgraded to Gold VIP."
                    className="w-full text-xs p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Admin Signer</label>
                    <select
                      value={adminSigner}
                      onChange={e => setAdminSigner(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg"
                    >
                      <option value="Karen Alcantara (Branch Supervisor)">Karen Alcantara (Branch Supervisor)</option>
                      <option value="Somchai Pradit (Head Therapist)">Somchai Pradit (Head Therapist)</option>
                      <option value="Janice Morales (Senior Receptionist)">Janice Morales (Senior Receptionist)</option>
                      <option value="Dante Ramos (Branch Manager)">Dante Ramos (Branch Manager)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch Location</label>
                    <input
                      type="text"
                      value={adminBranch}
                      onChange={e => setAdminBranch(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#20124D] hover:bg-[#2e1a70] text-[#F0D204] font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Save &amp; Log Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUICK STAMP (+1 / -1) WITH AUDIT NOTE */}
      {/* ========================================================= */}
      {showQuickStampModal && selectedCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${stampDelta > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {stampDelta > 0 ? <Plus className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {stampDelta > 0 ? 'Add Stamp' : 'Deduct Stamp'}
                </h3>
              </div>
              <button
                onClick={() => setShowQuickStampModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-bold text-slate-900">{selectedCard.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Stamps:</span>
                <span className="font-mono font-bold text-slate-900">{selectedCard.stamps} / {selectedCard.stampsTarget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New Stamps:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {Math.max(0, selectedCard.stamps + stampDelta)} / {selectedCard.stampsTarget}
                </span>
              </div>
            </div>

            <form onSubmit={handleQuickStampSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for adjustment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={quickStampReason}
                  onChange={e => setQuickStampReason(e.target.value)}
                  placeholder="e.g. Completed 60m Thai Foot Reflexology session with therapist Somchai."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#20124D]/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Admin Approver</label>
                <select
                  value={adminSigner}
                  onChange={e => setAdminSigner(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Karen Alcantara (Branch Supervisor)">Karen Alcantara (Branch Supervisor)</option>
                  <option value="Somchai Pradit (Head Therapist)">Somchai Pradit (Head Therapist)</option>
                  <option value="Janice Morales (Senior Receptionist)">Janice Morales (Senior Receptionist)</option>
                  <option value="Dante Ramos (Branch Manager)">Dante Ramos (Branch Manager)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickStampModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#20124D] hover:bg-[#2c1868] text-[#F0D204] font-bold text-xs cursor-pointer shadow-sm"
                >
                  Confirm &amp; Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: GRANT REWARD */}
      {/* ========================================================= */}
      {showGrantRewardModal && selectedCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3>Grant Loyalty Reward Voucher</h3>
              </div>
              <button onClick={() => setShowGrantRewardModal(false)} className="p-1 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantRewardSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reward Name</label>
                <select
                  value={grantRewardForm.name}
                  onChange={e => setGrantRewardForm({ ...grantRewardForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Free 60m Authentic Thai Body Massage">Free 60m Authentic Thai Body Massage</option>
                  <option value="Complimentary Steamed Luk Pra Kob Hot Compress">Complimentary Steamed Luk Pra Kob Hot Compress</option>
                  <option value="Free Nuat Thai Foot Spa & Peppermint Scrub">Free Nuat Thai Foot Spa &amp; Peppermint Scrub</option>
                  <option value="₱300 Nuat Thai Suki Voucher">₱300 Nuat Thai Suki Voucher</option>
                  <option value="Twin Synchronized Massage Upgrade">Twin Synchronized Massage Upgrade</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={grantRewardForm.description}
                  onChange={e => setGrantRewardForm({ ...grantRewardForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Admin Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={grantRewardForm.reason}
                  onChange={e => setGrantRewardForm({ ...grantRewardForm, reason: e.target.value })}
                  placeholder="e.g. VIP birthday reward / special loyalty milestone."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantRewardModal(false)}
                  className="px-3 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#20124D] text-[#F0D204] font-bold"
                >
                  Grant Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: REDEEM REWARD AT FRONT DESK */}
      {/* ========================================================= */}
      {showRedeemRewardModal && selectedCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Gift className="w-5 h-5 text-emerald-600" />
                <h3>Redeem Voucher at Front Desk</h3>
              </div>
              <button onClick={() => setShowRedeemRewardModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemRewardSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Are you sure you want to mark this reward as redeemed for <strong>{selectedCard.customerName}</strong>?
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Redemption Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={redeemReason}
                  onChange={e => setRedeemReason(e.target.value)}
                  placeholder="e.g. Client redeemed during 4:00 PM session at Suite Siam 2."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Staff Approver</label>
                <select
                  value={adminSigner}
                  onChange={e => setAdminSigner(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Karen Alcantara (Branch Supervisor)">Karen Alcantara (Branch Supervisor)</option>
                  <option value="Janice Morales (Senior Receptionist)">Janice Morales (Senior Receptionist)</option>
                  <option value="Somchai Pradit (Head Therapist)">Somchai Pradit (Head Therapist)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemRewardModal(false)}
                  className="px-3 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ISSUE NEW LOYALTY CARD */}
      {/* ========================================================= */}
      {showNewCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#20124D] text-[#F0D204]">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Issue New Nuat Thai Loyalty Card</h3>
                  <p className="text-xs text-slate-400">Enrolls a new guest with unique NT-SUKI pass &amp; initial stamps.</p>
                </div>
              </div>
              <button onClick={() => setShowNewCardModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueNewCard} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Customer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCardForm.customerName}
                    onChange={e => setNewCardForm({ ...newCardForm, customerName: e.target.value })}
                    placeholder="e.g. Beatriz Ramos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCardForm.customerPhone}
                    onChange={e => setNewCardForm({ ...newCardForm, customerPhone: e.target.value })}
                    placeholder="+63 (917) 000-0000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stamps</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newCardForm.stamps}
                    onChange={e => setNewCardForm({ ...newCardForm, stamps: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Membership Tier</label>
                  <select
                    value={newCardForm.tier}
                    onChange={e => setNewCardForm({ ...newCardForm, tier: e.target.value as LoyaltyTier })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Silver Suki">Silver Suki</option>
                    <option value="Gold VIP">Gold VIP</option>
                    <option value="Platinum Royal">Platinum Royal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch</label>
                  <select
                    value={newCardForm.homeBranch}
                    onChange={e => setNewCardForm({ ...newCardForm, homeBranch: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {NUAT_THAI_BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Email (Optional)</label>
                <input
                  type="email"
                  value={newCardForm.customerEmail}
                  onChange={e => setNewCardForm({ ...newCardForm, customerEmail: e.target.value })}
                  placeholder="e.g. beatriz@phmail.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                <span className="text-[11px] font-bold text-[#20124D] uppercase">Audit Trail Reason</span>
                <input
                  type="text"
                  value={newCardForm.reason}
                  onChange={e => setNewCardForm({ ...newCardForm, reason: e.target.value })}
                  className="w-full p-2 bg-white border border-purple-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  className="px-3 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#20124D] text-[#F0D204] font-bold shadow-md cursor-pointer"
                >
                  Issue Digital Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
