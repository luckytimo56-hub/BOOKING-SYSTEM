import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bell, CheckCircle2, XCircle, Clock, Calendar, User, Phone, Mail, 
  MapPin, ShieldCheck, Sparkles, Search, Filter, RefreshCw, AlertTriangle, 
  ArrowRight, UserCheck, Check, X, AlertCircle, Plus, Volume2, VolumeX,
  CreditCard, ChevronRight, HelpCircle, FileText, Send, Award
} from 'lucide-react';
import { Appointment, Therapist, AppointmentStatus, Branch, MassageService } from '../types';
import { MASSAGE_SERVICES, NUAT_THAI_BRANCHES, INITIAL_APPOINTMENTS } from '../data/initialData';

interface FrontDeskPanelProps {
  therapists: Therapist[];
  selectedBranch?: string;
  onNavigateToLoyalty?: (phoneOrName?: string) => void;
  onAppointmentsChanged?: () => void;
  branches?: Branch[];
  services?: MassageService[];
}

export const FrontDeskPanel: React.FC<FrontDeskPanelProps> = ({
  therapists,
  selectedBranch = 'bgc',
  onNavigateToLoyalty,
  onAppointmentsChanged,
  branches = NUAT_THAI_BRANCHES,
  services = MASSAGE_SERVICES
}) => {
  const currentBranches = branches && branches.length > 0 ? branches : NUAT_THAI_BRANCHES;
  const currentServices = services && services.length > 0 ? services : MASSAGE_SERVICES;
  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const cached = localStorage.getItem('serenity_appointments');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_APPOINTMENTS;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Filters
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'all'>('incoming');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  // Attendant Info
  const [attendantName, setAttendantName] = useState<string>('Rowena Cruz (Front Desk)');
  const [isEditingAttendant, setIsEditingAttendant] = useState<boolean>(false);

  // Accept Modal State
  const [acceptingAppointment, setAcceptingAppointment] = useState<Appointment | null>(null);
  const [assignedRoom, setAssignedRoom] = useState<string>('');
  const [assignedTherapistId, setAssignedTherapistId] = useState<string>('');
  const [attendantNotes, setAttendantNotes] = useState<string>('');
  const [isAccepting, setIsAccepting] = useState<boolean>(false);

  // Decline Modal State
  const [decliningAppointment, setDecliningAppointment] = useState<Appointment | null>(null);
  const [declineReasonType, setDeclineReasonType] = useState<string>('fully_booked');
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');
  const [isDeclining, setIsDeclining] = useState<boolean>(false);

  // Walk-In Modal State
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInEmail, setWalkInEmail] = useState<string>('');
  const [walkInServiceId, setWalkInServiceId] = useState<string>(MASSAGE_SERVICES[0].id);
  const [walkInDuration, setWalkInDuration] = useState<number>(60);
  const [walkInTherapistId, setWalkInTherapistId] = useState<string>(therapists[0]?.id || 'therapist-1');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('gcash');
  const [walkInImmediateCheckIn, setWalkInImmediateCheckIn] = useState<boolean>(true);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);

  // Notification Banner
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Track previous pending count to play sound chime on incoming
  const prevPendingCountRef = useRef<number>(0);

  const branchObj = currentBranches.find(b => b.id === selectedBranch) || currentBranches[0];

  // Play subtle luxury spa chime when incoming bookings arrive
  const playChime = () => {
    if (!soundAlerts) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/bookings').catch(() => null);
      if (res && res.ok) {
        const data: Appointment[] = await res.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) {
          setAppointments(data);
          try { localStorage.setItem('serenity_appointments', JSON.stringify(data)); } catch (e) {}
          setLastRefreshed(new Date());

          // Check if new pending bookings arrived
          const pendingNow = data.filter(a => a.status === 'pending').length;
          if (pendingNow > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
            playChime();
          }
          prevPendingCountRef.current = pendingNow;
        }
      }
    } catch (err) {
      // Backend offline / static fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-poll every 12 seconds for live front desk reception
    const interval = setInterval(fetchAppointments, 12000);
    return () => clearInterval(interval);
  }, []);

  // Today and Tomorrow strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Key KPI stats
  const pendingAppointments = useMemo(() => {
    return appointments.filter(a => a.status === 'pending');
  }, [appointments]);

  const todayBookings = useMemo(() => {
    return appointments.filter(a => a.date === todayStr);
  }, [appointments, todayStr]);

  const confirmedTodayCount = useMemo(() => {
    return todayBookings.filter(a => a.status === 'confirmed').length;
  }, [todayBookings]);

  const inServiceCount = useMemo(() => {
    return todayBookings.filter(a => a.status === 'in-service').length;
  }, [todayBookings]);

  const completedTodayCount = useMemo(() => {
    return todayBookings.filter(a => a.status === 'completed').length;
  }, [todayBookings]);

  const declinedCount = useMemo(() => {
    return appointments.filter(a => a.status === 'declined').length;
  }, [appointments]);

  // Filtered appointments for "All Bookings" view
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Date filter
      if (dateFilter === 'today' && apt.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && apt.date !== tomorrowStr) return false;

      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = apt.confirmationCode.toLowerCase().includes(q);
        const matchClient = apt.client.fullName.toLowerCase().includes(q);
        const matchPhone = (apt.client.phone || '').toLowerCase().includes(q);
        const matchTherapist = apt.therapistName.toLowerCase().includes(q);
        const matchService = apt.serviceName.toLowerCase().includes(q);
        if (!matchCode && !matchClient && !matchPhone && !matchTherapist && !matchService) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, dateFilter, statusFilter, searchQuery, todayStr, tomorrowStr]);

  // Handle Accept Booking
  const openAcceptModal = (apt: Appointment) => {
    setAcceptingAppointment(apt);
    setAssignedRoom(apt.roomNumber || 'Suite Siam 1');
    setAssignedTherapistId(apt.therapistId);
    setAttendantNotes(apt.client.notes ? `Client note: ${apt.client.notes}` : 'Confirmed by Front Desk Attendant.');
  };

  const handleConfirmAccept = async () => {
    if (!acceptingAppointment) return;
    setIsAccepting(true);

    const chosenTherapist = therapists.find(t => t.id === assignedTherapistId) || therapists[0];

    try {
      const res = await fetch(`/api/bookings/${acceptingAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          roomNumber: assignedRoom,
          therapistId: chosenTherapist.id,
          therapistName: chosenTherapist.name,
          therapistAvatar: chosenTherapist.avatar,
          acceptedBy: attendantName,
          frontDeskNotes: attendantNotes
        })
      });

      if (res.ok) {
        setActionAlert({
          type: 'success',
          message: `Booking ${acceptingAppointment.confirmationCode} for ${acceptingAppointment.client.fullName} has been APPROVED! Notification SMS & Email dispatched.`
        });
        setAcceptingAppointment(null);
        fetchAppointments();
        onAppointmentsChanged?.();
      } else {
        throw new Error('Failed to accept booking');
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: 'Could not approve booking. Please try again.' });
    } finally {
      setIsAccepting(false);
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  // Handle Decline Booking
  const openDeclineModal = (apt: Appointment) => {
    setDecliningAppointment(apt);
    setDeclineReasonType('fully_booked');
    setCustomDeclineReason('');
  };

  const handleConfirmDecline = async () => {
    if (!decliningAppointment) return;
    setIsDeclining(true);

    let finalReason = '';
    switch (declineReasonType) {
      case 'fully_booked':
        finalReason = 'Requested timeslot is completely booked. All therapy pods are occupied.';
        break;
      case 'therapist_unavailable':
        finalReason = `Specialist ${decliningAppointment.therapistName} is not available on this slot due to emergency relief schedule.`;
        break;
      case 'maintenance':
        finalReason = 'Massage pods are temporarily reserved for scheduled sanitization & deep cleaning.';
        break;
      case 'closing':
        finalReason = 'Requested session exceeds branch closing hours.';
        break;
      case 'custom':
      default:
        finalReason = customDeclineReason.trim() || 'Schedule conflict during this time slot.';
        break;
    }

    try {
      const res = await fetch(`/api/bookings/${decliningAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'declined',
          declineReason: finalReason,
          declinedBy: attendantName
        })
      });

      if (res.ok) {
        setActionAlert({
          type: 'success',
          message: `Booking ${decliningAppointment.confirmationCode} DECLINED. Rejection notice sent to ${decliningAppointment.client.fullName}.`
        });
        setDecliningAppointment(null);
        fetchAppointments();
        onAppointmentsChanged?.();
      } else {
        throw new Error('Failed to decline booking');
      }
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Could not decline booking. Please try again.' });
    } finally {
      setIsDeclining(false);
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  // Handle Check-in (Move to in-service)
  const handleCheckIn = async (apt: Appointment) => {
    try {
      const res = await fetch(`/api/bookings/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in-service',
          acceptedBy: attendantName
        })
      });
      if (res.ok) {
        setActionAlert({
          type: 'success',
          message: `${apt.client.fullName} checked in to ${apt.roomNumber}! Treatment is now IN-SERVICE.`
        });
        fetchAppointments();
        onAppointmentsChanged?.();
      }
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to update check-in status.' });
    } finally {
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  // Handle Mark Completed
  const handleMarkCompleted = async (apt: Appointment) => {
    try {
      const res = await fetch(`/api/bookings/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed'
        })
      });
      if (res.ok) {
        setActionAlert({
          type: 'success',
          message: `Session for ${apt.client.fullName} marked COMPLETED! Ready for checkout and Suki stamp issue.`
        });
        fetchAppointments();
        onAppointmentsChanged?.();
      }
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to mark session completed.' });
    } finally {
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  // Handle Submit Walk-In Booking
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    setIsSubmittingWalkIn(true);

    const service = MASSAGE_SERVICES.find(s => s.id === walkInServiceId) || MASSAGE_SERVICES[0];
    const durationObj = service.durations.find(d => d.durationMinutes === walkInDuration) || service.durations[0];
    const therapist = therapists.find(t => t.id === walkInTherapistId) || therapists[0];

    const now = new Date();
    const startTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBookingData = {
      serviceId: service.id,
      durationMinutes: durationObj.durationMinutes,
      therapistId: therapist.id,
      date: todayStr,
      startTime: startTimeStr,
      addons: [],
      client: {
        fullName: walkInName.trim(),
        email: walkInEmail.trim() || `${walkInName.toLowerCase().replace(/\s+/g, '')}@walkin.nuatph.com`,
        phone: walkInPhone.trim() || '+63 (917) 000-0000',
        pressurePreference: 'Medium / Balanced',
        focusAreas: ['Full Body'],
        medicalConditions: [],
        notes: `Walk-in client registered at front desk by ${attendantName}.`
      },
      paymentMethod: walkInPaymentMethod === 'cash' ? 'credit_card' : 'credit_card',
      paymentType: 'full',
      status: walkInImmediateCheckIn ? 'in-service' : 'confirmed',
      branchId: selectedBranch
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookingData)
      });

      if (res.ok) {
        const created = await res.json();
        setActionAlert({
          type: 'success',
          message: `Walk-in booking created for ${walkInName}! Ref: ${created.appointment.confirmationCode}`
        });
        setShowWalkInModal(false);
        setWalkInName('');
        setWalkInPhone('');
        setWalkInEmail('');
        fetchAppointments();
        onAppointmentsChanged?.();
      } else {
        throw new Error('Failed to register walk-in');
      }
    } catch (err) {
      setActionAlert({ type: 'error', message: 'Failed to create walk-in registration.' });
    } finally {
      setIsSubmittingWalkIn(false);
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* 1. TOP FRONT DESK BANNER & ATTENDANT CONTROLS */}
      <div className="bg-gradient-to-r from-[#1e1045] via-[#28135e] to-[#12082b] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-yellow-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F0D204] text-[#1e1045] flex items-center justify-center font-black text-base shadow-md border border-yellow-200">
              FD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-[#F0D204] uppercase">
                  Front Desk Reception &amp; Attendant Ops
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Incoming online bookings review, acceptance/decline controls, and guest check-in &bull; {branchObj.name}
              </p>
            </div>
          </div>
        </div>

        {/* Attendant Badge, Audio Chime Toggle, & Walk-In Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio Chime alert toggle */}
          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
              soundAlerts 
                ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 hover:bg-yellow-400/30' 
                : 'bg-white/5 text-purple-300 border-white/10 hover:bg-white/10'
            }`}
            title={soundAlerts ? 'Incoming Booking Chime Active' : 'Sound Chime Muted'}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4 text-yellow-300" /> : <VolumeX className="w-4 h-4 text-purple-400" />}
            <span className="text-[11px] hidden sm:inline">{soundAlerts ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Attendant on duty pill */}
          <div className="bg-[#150b33] border border-purple-800/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <UserCheck className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] text-purple-300 block uppercase font-bold tracking-wider">Attendant Duty</span>
              {isEditingAttendant ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={attendantName}
                    onChange={(e) => setAttendantName(e.target.value)}
                    className="bg-purple-950 text-yellow-200 px-1.5 py-0.5 text-xs rounded border border-purple-700 focus:outline-none"
                  />
                  <button 
                    onClick={() => setIsEditingAttendant(false)}
                    className="text-[10px] bg-yellow-400 text-[#1e1045] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingAttendant(true)}
                  className="font-bold text-white hover:text-yellow-300 transition cursor-pointer text-xs flex items-center gap-1"
                >
                  <span>{attendantName}</span>
                  <span className="text-[10px] text-purple-400 underline">(edit)</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Walk-In Button */}
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2 bg-[#F0D204] hover:bg-[#ffe129] text-[#1e1045] rounded-xl text-xs font-black transition shadow-md flex items-center gap-1.5 border border-yellow-200 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#1e1045]" />
            <span>Register Walk-In</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="p-2 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
            title="Refresh Bookings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-yellow-300' : ''}`} />
          </button>
        </div>
      </div>

      {/* ACTION ALERT TOAST */}
      {actionAlert && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-md animate-in slide-in-from-top-2 ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{actionAlert.message}</span>
          <button 
            onClick={() => setActionAlert(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. REAL-TIME KPI TILES STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Incoming Pending Queue Card - HIGHLIGHTED */}
        <div 
          onClick={() => setActiveSubTab('incoming')}
          className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
            activeSubTab === 'incoming'
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/50'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full bg-amber-500 ${pendingAppointments.length > 0 ? 'animate-ping' : ''}`} />
              Incoming Requests
            </span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Bell className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{pendingAppointments.length}</span>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting Approval</span>
          </div>
        </div>

        {/* Confirmed Today */}
        <div 
          onClick={() => {
            setActiveSubTab('all');
            setStatusFilter('confirmed');
            setDateFilter('today');
          }}
          className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
            activeSubTab === 'all' && statusFilter === 'confirmed'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Confirmed Today
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-950">{confirmedTodayCount}</span>
            <span className="text-[10px] text-slate-500">Ready for Arrival</span>
          </div>
        </div>

        {/* Currently In-Service (In Pods) */}
        <div 
          onClick={() => {
            setActiveSubTab('all');
            setStatusFilter('in-service');
            setDateFilter('today');
          }}
          className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
            activeSubTab === 'all' && statusFilter === 'in-service'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-300'
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              In-Service Now
            </span>
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-950">{inServiceCount}</span>
            <span className="text-[10px] text-slate-500">In Therapy Pods</span>
          </div>
        </div>

        {/* Completed Today */}
        <div 
          onClick={() => {
            setActiveSubTab('all');
            setStatusFilter('completed');
            setDateFilter('today');
          }}
          className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
            activeSubTab === 'all' && statusFilter === 'completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950">{completedTodayCount}</span>
            <span className="text-[10px] text-slate-500">Finished Today</span>
          </div>
        </div>

        {/* Declined */}
        <div 
          onClick={() => {
            setActiveSubTab('all');
            setStatusFilter('declined');
            setDateFilter('all');
          }}
          className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
            activeSubTab === 'all' && statusFilter === 'declined'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-300'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Declined
            </span>
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <XCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-950">{declinedCount}</span>
            <span className="text-[10px] text-slate-500">Capacity / Conflict</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE TOGGLE & SEARCH TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('incoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'incoming'
                ? 'bg-[#1e1045] text-[#F0D204] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Incoming Queue</span>
            {pendingAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                {pendingAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-[#1e1045] text-[#F0D204] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>All Bookings &amp; Register</span>
            <span className="text-[11px] text-slate-400 font-normal">({appointments.length})</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, guest name, phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#1e1045]/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. VIEW A: INCOMING BOOKINGS QUEUE (AWAITING FRONT DESK DECISION) */}
      {activeSubTab === 'incoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-base font-bold text-slate-900">
                Incoming Requests Requiring Front Desk Action ({pendingAppointments.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Attendants must accept to assign pod &amp; trigger confirmation SMS, or decline with reason.
            </span>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">All Incoming Bookings Cleared!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending incoming booking requests waiting for front desk approval right now. New online customer submissions will appear here instantly with an audible chime.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="px-4 py-2 bg-[#1e1045] hover:bg-[#28135e] text-[#F0D204] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Register Walk-In Guest
                </button>
                <button
                  onClick={() => setActiveSubTab('all')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Active Bookings
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingAppointments.map(apt => {
                const isToday = apt.date === todayStr;

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-3xl border-2 border-amber-300 shadow-md p-5 sm:p-6 transition hover:shadow-lg relative overflow-hidden"
                  >
                    {/* Top attention bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                          <span>Incoming &bull; Awaiting Decision</span>
                        </span>
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                          Ref: {apt.confirmationCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Submitted: {new Date(apt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isToday ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isToday ? 'Today' : apt.date}
                        </span>
                        <span className="font-bold text-slate-800">{apt.startTime} - {apt.endTime}</span>
                        <span className="text-slate-400">({apt.durationMinutes} mins)</span>
                      </div>
                    </div>

                    {/* Middle details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4">
                      {/* Column 1: Client details */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Guest Information
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-[#1e1045] font-black text-xs flex items-center justify-center border border-yellow-300">
                            {apt.client.fullName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {apt.client.fullName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{apt.client.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[200px]">{apt.client.email}</span>
                        </div>
                      </div>

                      {/* Column 2: Treatment & Special Requests */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Treatment &amp; Preferences
                        </span>
                        <div className="text-xs font-bold text-[#1e1045]">
                          {apt.serviceName}
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded border border-purple-200">
                            Pressure: {apt.client.pressurePreference || 'Medium'}
                          </span>
                          {apt.addons.map(a => (
                            <span key={a.id} className="px-2 py-0.5 bg-yellow-50 text-amber-900 font-semibold rounded border border-yellow-200">
                              + {a.name}
                            </span>
                          ))}
                        </div>
                        {apt.client.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                            &ldquo;{apt.client.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Column 3: Specialist & Payment */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Specialist, Pod &amp; Payment
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <img
                            src={apt.therapistAvatar}
                            alt={apt.therapistName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-300"
                          />
                          <div>
                            <span className="font-bold text-slate-800">{apt.therapistName}</span>
                            <span className="text-[11px] text-slate-500 block">{apt.roomNumber}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Bill Total:</span>
                          <span className="font-bold text-slate-900 font-mono">₱{apt.pricing.total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-600" />
                            <span>{apt.payment.cardBrand || 'GCash Online'}</span>
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                            {apt.pricing.balanceDue === 0 ? 'Fully Paid' : 'Deposit Paid'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (ACCEPT & DECLINE) */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
                      <button
                        onClick={() => openDeclineModal(apt)}
                        className="px-4 py-2.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Decline Request</span>
                      </button>

                      <button
                        onClick={() => openAcceptModal(apt)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept &amp; Confirm Booking</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW B: ALL BOOKINGS & DAILY RECEPTION REGISTER */}
      {activeSubTab === 'all' && (
        <div className="space-y-4">
          {/* Sub-filters (Date & Status pills) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            {/* Date filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  dateFilter === 'today' ? 'bg-[#1e1045] text-[#F0D204] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today ({todayStr})
              </button>
              <button
                onClick={() => setDateFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  dateFilter === 'tomorrow' ? 'bg-[#1e1045] text-[#F0D204] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tomorrow ({tomorrowStr})
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  dateFilter === 'all' ? 'bg-[#1e1045] text-[#F0D204] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Dates
              </button>
            </div>

            {/* Status filter dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending (Incoming)</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-service">In-Service (Pods)</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table / List of bookings */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs">
              <p className="text-xs text-slate-400">No bookings match the selected date and status filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Ref Code</th>
                      <th className="py-3 px-4">Time &amp; Date</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Treatment</th>
                      <th className="py-3 px-4">Specialist &amp; Pod</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Front Desk Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredAppointments.map(apt => {
                      const isPending = apt.status === 'pending';
                      const isConfirmed = apt.status === 'confirmed';
                      const isInService = apt.status === 'in-service';
                      const isCompleted = apt.status === 'completed';
                      const isDeclined = apt.status === 'declined';

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                          {/* Ref Code */}
                          <td className="py-3 px-4 font-mono font-bold text-[#1e1045]">
                            {apt.confirmationCode}
                          </td>

                          {/* Time & Date */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{apt.startTime} - {apt.endTime}</div>
                            <div className="text-[10px] text-slate-400">{apt.date}</div>
                          </td>

                          {/* Client */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{apt.client.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{apt.client.phone}</div>
                          </td>

                          {/* Treatment */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{apt.serviceName}</div>
                            <div className="text-[10px] text-slate-400">{apt.durationMinutes} mins &bull; ₱{apt.pricing.total}</div>
                          </td>

                          {/* Specialist & Pod */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{apt.therapistName}</div>
                            <div className="text-[10px] text-purple-700 font-medium">{apt.roomNumber}</div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {isPending && (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black rounded-full text-[10px] uppercase border border-amber-300 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                Incoming
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px] uppercase">
                                Confirmed
                              </span>
                            )}
                            {isInService && (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-black rounded-full text-[10px] uppercase border border-purple-300">
                                In Pod
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] uppercase">
                                Completed
                              </span>
                            )}
                            {isDeclined && (
                              <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px] uppercase">
                                Declined
                              </span>
                            )}
                            {apt.status === 'cancelled' && (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-[10px] uppercase">
                                Cancelled
                              </span>
                            )}
                          </td>

                          {/* Front Desk Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If Pending: Accept / Decline buttons */}
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => openAcceptModal(apt)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => openDeclineModal(apt)}
                                    className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {/* If Confirmed: Check In */}
                              {isConfirmed && (
                                <button
                                  onClick={() => handleCheckIn(apt)}
                                  className="px-3 py-1 bg-[#1e1045] hover:bg-[#2c1766] text-[#F0D204] rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Check In</span>
                                </button>
                              )}

                              {/* If In-Service: Mark Completed */}
                              {isInService && (
                                <button
                                  onClick={() => handleMarkCompleted(apt)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Done / Checkout</span>
                                </button>
                              )}

                              {/* If Completed: Option to jump to loyalty card stamps */}
                              {isCompleted && onNavigateToLoyalty && (
                                <button
                                  onClick={() => onNavigateToLoyalty(apt.client.phone || apt.client.fullName)}
                                  className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title="Stamp Suki Loyalty Card"
                                >
                                  <Award className="w-3 h-3 text-yellow-600" />
                                  <span>Stamp Suki</span>
                                </button>
                              )}

                              {/* If Declined: Show reason tooltip/modal */}
                              {isDeclined && apt.declineReason && (
                                <span className="text-[10px] text-red-600 italic bg-red-50 px-2 py-0.5 rounded border border-red-100 max-w-[150px] truncate" title={apt.declineReason}>
                                  &ldquo;{apt.declineReason}&rdquo;
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: ACCEPT / APPROVE BOOKING                       */}
      {/* ======================================================== */}
      {acceptingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approve &amp; Confirm Reservation</h3>
                  <p className="text-xs text-slate-500">Ref: {acceptingAppointment.confirmationCode} &bull; {acceptingAppointment.client.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setAcceptingAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary details */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Treatment:</span>
                <span className="font-bold text-slate-900">{acceptingAppointment.serviceName} ({acceptingAppointment.durationMinutes} mins)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-bold text-slate-900">{acceptingAppointment.date} at {acceptingAppointment.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Phone:</span>
                <span className="font-mono text-slate-800">{acceptingAppointment.client.phone}</span>
              </div>
            </div>

            {/* Assign/Confirm Room Pod & Specialist */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Assign Therapy Pod / Room
                </label>
                <input
                  type="text"
                  value={assignedRoom}
                  onChange={(e) => setAssignedRoom(e.target.value)}
                  placeholder="e.g. Suite Siam 1, Reflexology Pod 3"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Assigned Therapist Specialist
                </label>
                <select
                  value={assignedTherapistId}
                  onChange={(e) => setAssignedTherapistId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} &bull; {t.roomNumber} ({t.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Front Desk Welcome / Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={attendantNotes}
                  onChange={(e) => setAttendantNotes(e.target.value)}
                  placeholder="Notes for therapist or guest on arrival..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Notice */}
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Approving will dispatch automated confirmation SMS &amp; Email with room details to the guest.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptingAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isAccepting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isAccepting ? 'Confirming...' : 'Approve & Notify Guest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: DECLINE / REJECT BOOKING                       */}
      {/* ======================================================== */}
      {decliningAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Decline Reservation Request</h3>
                  <p className="text-xs text-slate-500">Ref: {decliningAppointment.confirmationCode} &bull; {decliningAppointment.client.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setDecliningAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please select the operational reason for declining this request. The customer will be respectfully notified via SMS and email with guidance to pick another time.
            </p>

            {/* Select Reason */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Reason for Non-Confirmation
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="declineReason"
                    value="fully_booked"
                    checked={declineReasonType === 'fully_booked'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Fully Booked Timeslot</span>
                    <p className="text-[11px] text-slate-500">All therapy pods and beds are filled for this hour.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="declineReason"
                    value="therapist_unavailable"
                    checked={declineReasonType === 'therapist_unavailable'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Requested Specialist Unavailable</span>
                    <p className="text-[11px] text-slate-500">Therapist on medical break or emergency shift absence.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="declineReason"
                    value="maintenance"
                    checked={declineReasonType === 'maintenance'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Pod Sanitization / Deep Cleaning</span>
                    <p className="text-[11px] text-slate-500">Scheduled ozone air sanitization &amp; herbal compress restocking.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="declineReason"
                    value="custom"
                    checked={declineReasonType === 'custom'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Other Specific Operational Reason</span>
                    <p className="text-[11px] text-slate-500">Type a tailored explanation to appear on customer notification.</p>
                  </div>
                </label>
              </div>

              {declineReasonType === 'custom' && (
                <textarea
                  rows={2}
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  placeholder="Explain why this booking cannot be accommodated..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
                />
              )}
            </div>

            {/* Warning */}
            <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>If payment was authorized online, no charge will settle or refund will automatically release.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecliningAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={isDeclining}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isDeclining ? 'Declining...' : 'Confirm Decline & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: REGISTER WALK-IN CUSTOMER                      */}
      {/* ======================================================== */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-100 text-[#1e1045] flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Front Desk Walk-In Registration</h3>
                  <p className="text-xs text-slate-500">Quick-entry for walk-in guests at reception</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-3">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Samantha Cruz"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1045]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+63 (917) 000-0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1045]"
                  />
                </div>
              </div>

              {/* Service & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Selected Treatment
                  </label>
                  <select
                    value={walkInServiceId}
                    onChange={(e) => setWalkInServiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1045]"
                  >
                    {currentServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Duration
                  </label>
                  <select
                    value={walkInDuration}
                    onChange={(e) => setWalkInDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1045]"
                  >
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes (Recommended)</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Specialist */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Assign Specialist
                </label>
                <select
                  value={walkInTherapistId}
                  onChange={(e) => setWalkInTherapistId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e1045]"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} &bull; {t.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInPaymentMethod('cash')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      walkInPaymentMethod === 'cash'
                        ? 'bg-[#1e1045] text-[#F0D204] border-[#1e1045]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInPaymentMethod('gcash')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      walkInPaymentMethod === 'gcash'
                        ? 'bg-[#1e1045] text-[#F0D204] border-[#1e1045]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    GCash / Maya
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInPaymentMethod('card')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      walkInPaymentMethod === 'card'
                        ? 'bg-[#1e1045] text-[#F0D204] border-[#1e1045]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    POS Card
                  </button>
                </div>
              </div>

              {/* Immediate Check-In toggle */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={walkInImmediateCheckIn}
                  onChange={(e) => setWalkInImmediateCheckIn(e.target.checked)}
                  className="rounded text-[#1e1045] focus:ring-[#1e1045]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Check-in immediately (Guest is entering therapy pod now)
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="px-5 py-2 bg-[#1e1045] hover:bg-[#28135e] text-[#F0D204] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-yellow-400/30"
                >
                  {isSubmittingWalkIn ? 'Saving...' : 'Register Walk-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
