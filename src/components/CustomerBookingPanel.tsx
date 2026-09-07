import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, Clock, User, ShieldCheck, CheckCircle2, 
  ArrowLeft, ArrowRight, ChevronRight, Phone, Mail, CreditCard, 
  Smartphone, Search, RefreshCw, X, AlertCircle, Download, Check,
  Award, Gift, History
} from 'lucide-react';
import { Therapist, Appointment, TimeSlot, MassageService, AddonOption, LoyaltyCard, Branch } from '../types';
import { MASSAGE_SERVICES, ADDON_OPTIONS, NUAT_THAI_BRANCHES } from '../data/initialData';

interface CustomerBookingPanelProps {
  therapists: Therapist[];
  onBookingCreated: (appointment: Appointment) => void;
  onClose?: () => void;
  isDrawerMode?: boolean;
  services?: MassageService[];
  branches?: Branch[];
}

export const CustomerBookingPanel: React.FC<CustomerBookingPanelProps> = ({
  therapists,
  onBookingCreated,
  onClose,
  isDrawerMode = false,
  services = MASSAGE_SERVICES,
  branches = NUAT_THAI_BRANCHES
}) => {
  const currentServices = services && services.length > 0 ? services : MASSAGE_SERVICES;
  const currentBranches = branches && branches.length > 0 ? branches : NUAT_THAI_BRANCHES;

  // Mode: 'book' or 'manage' (My Reservations) or 'loyalty' (Digital Loyalty Pass)
  const [panelMode, setPanelMode] = useState<'book' | 'manage' | 'loyalty'>('book');

  // Step in express booking: 1: Service & Specialist, 2: Date & Slot, 3: Guest & SMS, 4: Confirmed
  const [step, setStep] = useState<number>(1);

  // Selection states
  const [selectedService, setSelectedService] = useState<MassageService>(currentServices[0] || MASSAGE_SERVICES[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('any');
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!currentServices.some(s => s.id === selectedService.id)) {
      setSelectedService(currentServices[0] || MASSAGE_SERVICES[0]);
    }
  }, [currentServices]);

  // Date & Time states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotLockedTimer, setSlotLockedTimer] = useState<number>(600); // 10 mins

  // Guest & Intake state
  const [guestName, setGuestName] = useState<string>('Sarah Jenkins');
  const [guestEmail, setGuestEmail] = useState<string>('tjfcc864@gmail.com');
  const [guestPhone, setGuestPhone] = useState<string>('+1 (555) 234-8891');
  const [receiveSmsReminders, setReceiveSmsReminders] = useState<boolean>(true);
  const [pressureLevel, setPressureLevel] = useState<string>('Medium / Balanced');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Confirmed result
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Manage Bookings State (My Reservations)
  const [lookupQuery, setLookupQuery] = useState<string>('tjfcc864@gmail.com');
  const [userBookings, setUserBookings] = useState<Appointment[]>([]);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Appointment | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);

  // Digital Loyalty Card State
  const [loyaltyQuery, setLoyaltyQuery] = useState<string>('0917-882-9912');
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState<boolean>(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);

  const handleSearchLoyalty = async (queryVal?: string) => {
    const q = queryVal !== undefined ? queryVal : loyaltyQuery;
    if (!q.trim()) return;
    setLoyaltyLoading(true);
    setLoyaltyError(null);
    try {
      const res = await fetch(`/api/loyalty-cards/lookup?query=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setLoyaltyCard(data);
      } else {
        setLoyaltyCard(null);
        setLoyaltyError('No active Nuat Thai Suki loyalty card found matching that number or phone.');
      }
    } catch (err) {
      setLoyaltyError('Failed to retrieve loyalty card details. Please try again.');
    } finally {
      setLoyaltyLoading(false);
    }
  };

  // Calculate pricing
  const currentDurationObj = selectedService.durations.find(d => d.durationMinutes === selectedDuration) || selectedService.durations[0];
  const servicePrice = currentDurationObj.price;
  const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = servicePrice + addonsPrice;
  const discount = Math.round(subtotal * 0.1); // 10% customer booking incentive
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * 0.085 * 100) / 100;
  const total = taxable + tax;
  const amountToPayNow = paymentOption === 'deposit' ? Math.min(50, total) : total;
  const balanceAtCheckin = Math.max(0, total - amountToPayNow);

  // Fetch slots
  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const q = new URLSearchParams({
        date: selectedDate,
        therapistId: selectedTherapistId,
        duration: String(selectedDuration)
      });
      const res = await fetch(`/api/availability?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDate, selectedTherapistId, selectedDuration]);

  // Lock timer countdown
  useEffect(() => {
    if (!selectedSlotTime) return;
    const interval = setInterval(() => {
      setSlotLockedTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSlotTime]);

  // Handle final submission
  const handleCompleteBooking = async () => {
    if (!guestName || !guestEmail || !selectedSlotTime) {
      setBookingError('Please complete all required fields and select an appointment time.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const payload = {
        serviceId: selectedService.id,
        durationMinutes: selectedDuration,
        therapistId: selectedTherapistId,
        date: selectedDate,
        startTime: selectedSlotTime,
        addons: selectedAddons,
        client: {
          fullName: guestName,
          email: guestEmail,
          phone: guestPhone,
          receiveSmsReminders,
          pressurePreference: pressureLevel,
          focusAreas: ['Full Body Alignment'],
          medicalConditions: [],
          notes: guestNotes
        },
        paymentMethod: 'credit_card',
        paymentType: paymentOption,
        tipAmount: 0,
        promoCode: 'CLIENT10',
        cardLast4: '4242',
        cardBrand: 'Visa'
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to complete reservation');
      }

      const data = await res.json();
      setConfirmedBooking(data.appointment);
      onBookingCreated(data.appointment);
      setStep(4);
    } catch (err: any) {
      setBookingError(err.message || 'Booking reservation failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Lookup in "My Reservations"
  const handleSearchBookings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/bookings?search=${encodeURIComponent(lookupQuery.trim())}`);
      if (res.ok) {
        const data: Appointment[] = await res.json();
        const matches = data.filter(a => 
          a.confirmationCode.toLowerCase().includes(lookupQuery.trim().toLowerCase()) ||
          a.client.email.toLowerCase().includes(lookupQuery.trim().toLowerCase()) ||
          a.client.phone.includes(lookupQuery.trim())
        );
        setUserBookings(matches);
        if (matches.length === 0) {
          setLookupError(`No reservations found for "${lookupQuery}". Try your confirmation code or email.`);
        }
      }
    } catch (err) {
      setLookupError('Failed to search reservations.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Reschedule
  const handleSaveReschedule = async (aptId: string) => {
    if (!newRescheduleDate || !newRescheduleTime) return;
    try {
      const res = await fetch(`/api/bookings/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newRescheduleDate,
          startTime: newRescheduleTime
        })
      });
      if (res.ok) {
        setRescheduleSuccess('Reservation successfully rescheduled! A confirmation SMS and email have been sent.');
        setReschedulingBooking(null);
        handleSearchBookings();
        setTimeout(() => setRescheduleSuccess(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (aptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await fetch(`/api/bookings/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        handleSearchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 14 upcoming dates
  const upcomingDates = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const iso = d.toISOString().split('T')[0];
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { iso, day, monthDay, isToday: idx === 0 };
  });

  const resolvedTherapist = therapists.find(t => t.id === selectedTherapistId);

  return (
    <div className={`bg-white ${isDrawerMode ? 'h-full flex flex-col' : 'max-w-6xl mx-auto my-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden'}`}>
      {/* Top Header Bar for Customer Panel */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Customer Booking Panel</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30 uppercase tracking-wider">
                Guest Self-Service
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Instant appointment scheduling with automated SMS text &amp; email reminders
            </p>
          </div>
        </div>

        {/* Mode Selector (Book vs Manage) & Close */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setPanelMode('book')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                panelMode === 'book' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Booking
            </button>
            <button
              onClick={() => {
                setPanelMode('manage');
                handleSearchBookings();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                panelMode === 'manage' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Reservations
            </button>
            <button
              onClick={() => {
                setPanelMode('loyalty');
                handleSearchLoyalty();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                panelMode === 'loyalty' ? 'bg-[#F0D204] text-[#1e1045] shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Digital Suki Card</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* VIEW A: NEW BOOKING FLOW */}
      {panelMode === 'book' && (
        <div className="flex-1 flex flex-col">
          {/* Step Progression Tabs */}
          {step < 4 && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-6 text-xs">
                <button
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-1.5 font-semibold cursor-pointer ${
                    step === 1 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>1</span>
                  <span className="hidden sm:inline">Treatment &amp; Specialist</span>
                  <span className="sm:hidden">Service</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

                <button
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-1.5 font-semibold cursor-pointer ${
                    step === 2 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>2</span>
                  <span className="hidden sm:inline">Date &amp; Time Slot</span>
                  <span className="sm:hidden">Time</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedSlotTime}
                  className={`flex items-center gap-1.5 font-semibold cursor-pointer ${
                    step === 3 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  } ${!selectedSlotTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>3</span>
                  <span className="hidden sm:inline">Guest &amp; SMS Reminders</span>
                  <span className="sm:hidden">Details</span>
                </button>
              </div>

              {/* Slot Hold Pill if slot picked */}
              {selectedSlotTime && (
                <div className="flex items-center gap-1.5 bg-blue-100/70 border border-blue-200 text-blue-900 text-[11px] px-2.5 py-1 rounded-md font-mono">
                  <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
                  <span>{selectedSlotTime} ({Math.floor(slotLockedTimer / 60)}:{String(slotLockedTimer % 60).padStart(2, '0')} held)</span>
                </div>
              )}
            </div>
          )}

          {/* Body content based on step */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {/* STEP 1: TREATMENT & SPECIALIST */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: 'All Treatments' },
                    { id: 'therapeutic', label: 'Therapeutic & Deep Tissue' },
                    { id: 'relaxation', label: 'Swedish & Tranquility' },
                    { id: 'holistic', label: 'Holistic & Aromatherapy' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        categoryFilter === cat.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentServices
                    .filter(s => categoryFilter === 'all' || s.category === categoryFilter)
                    .map(service => {
                      const isSelected = selectedService.id === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                {service.category}
                              </span>
                              {service.popular && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  ★ Popular
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 mt-2">{service.name}</h3>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {service.tagline}
                            </p>
                          </div>

                          {/* Duration Selection for this card */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {service.durations.map(dur => (
                                <button
                                  key={dur.durationMinutes}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedService(service);
                                    setSelectedDuration(dur.durationMinutes);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                    isSelected && selectedDuration === dur.durationMinutes
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {dur.durationMinutes}m • ${dur.price}
                                </button>
                              ))}
                            </div>

                            <span className="text-xs font-bold text-slate-900">
                              From ${service.durations[0].price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Specialist / Practitioner Choice */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                    Select Bodywork Specialist
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Any available option */}
                    <div
                      onClick={() => setSelectedTherapistId('any')}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                        selectedTherapistId === 'any'
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">First Available</span>
                      <span className="text-[10px] text-slate-500">Fastest Opening</span>
                    </div>

                    {/* Active therapists */}
                    {therapists.slice(0, 3).map(th => {
                      const isChosen = selectedTherapistId === th.id;
                      return (
                        <div
                          key={th.id}
                          onClick={() => setSelectedTherapistId(th.id)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                            isChosen
                              ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={th.avatar}
                            alt={th.name}
                            className="w-10 h-10 rounded-full mx-auto object-cover mb-1.5 border border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-900 block truncate">{th.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">★ {th.rating} ({th.reviewCount})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Enhancements */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                    Optional Treatment Enhancements
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ADDON_OPTIONS.slice(0, 4).map(addon => {
                      const isAdded = selectedAddons.some(a => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => {
                            if (isAdded) {
                              setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
                            } else {
                              setSelectedAddons([...selectedAddons, addon]);
                            }
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                            isAdded
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{addon.name}</span>
                            <span className="text-[11px] text-slate-500">+{addon.extraMinutes} mins • {addon.description}</span>
                          </div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                            {isAdded ? '✓ Added' : `+$${addon.price}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Step Control */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    Selected: <strong className="text-slate-900">{selectedService.name}</strong> ({selectedDuration}m) • ${subtotal}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <span>Pick Date &amp; Time</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATE & TIME SLOTS */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Date Selection Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                      Choose Your Preferred Date
                    </h3>
                    <span className="text-xs text-blue-600 font-semibold">
                      {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {upcomingDates.map(item => {
                      const isSelected = selectedDate === item.iso;
                      return (
                        <button
                          key={item.iso}
                          onClick={() => {
                            setSelectedDate(item.iso);
                            setSelectedSlotTime('');
                          }}
                          className={`p-2.5 rounded-xl border text-center shrink-0 w-20 transition cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold block ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                            {item.day}
                          </span>
                          <span className="text-sm font-bold block mt-0.5">
                            {item.monthDay}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                      Select Available Time Slot
                    </h3>
                    <button
                      onClick={fetchSlots}
                      className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSlots ? 'animate-spin' : ''}`} />
                      <span>Sync Real-Time Slots</span>
                    </button>
                  </div>

                  {loadingSlots ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Checking therapist calendars &amp; room availability...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-700 font-semibold">No available slots on this date.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try selecting another date or practitioner.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {availableSlots.map(slot => {
                        const isSelected = selectedSlotTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => {
                              setSelectedSlotTime(slot.time);
                              setSlotLockedTimer(600);
                            }}
                            className={`p-2.5 rounded-xl border text-center transition ${
                              !slot.available
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : isSelected
                                ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                            }`}
                          >
                            <span className="text-xs font-mono font-semibold block">{slot.time}</span>
                            <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-blue-100' : slot.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {slot.available ? 'Available' : 'Booked'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    disabled={!selectedSlotTime}
                    onClick={() => setStep(3)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm ${
                      selectedSlotTime 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue to Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GUEST INTAKE & SMS NOTIFICATION TOGGLE */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Summary Pill */}
                <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">
                      {selectedService.name} ({selectedDuration} mins)
                    </span>
                    <span className="text-slate-600">
                      {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlotTime} • {resolvedTherapist?.name || 'Assigned Master Bodyworker'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-700 block">${total}</span>
                    <span className="text-[10px] text-slate-500">Includes taxes &amp; early booking discount</span>
                  </div>
                </div>

                {/* Client Information Form */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                    Guest Contact Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Email Address (for Receipt) *</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="e.g. sarah@example.com"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Mobile Phone (for SMS Reminders) *</label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* SMS NOTIFICATION TOGGLE CALLOUT */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Receive SMS Appointment Reminders via Text
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            Receive an instant confirmation text, a 24-hour reminder, and private suite entry gate codes to <strong className="text-slate-800">{guestPhone || 'your phone'}</strong> in addition to email notifications.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={receiveSmsReminders}
                        onClick={() => setReceiveSmsReminders(!receiveSmsReminders)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          receiveSmsReminders ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            receiveSmsReminders ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[10px] text-blue-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Complimentary service • No promotional spam • Reply STOP to unsubscribe at any time</span>
                    </div>
                  </div>

                  {/* Pressure Preference */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pressure Preference</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Light / Gentle', 'Medium / Balanced', 'Firm', 'Deep Tissue / Intensive'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPressureLevel(p)}
                          className={`p-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            pressureLevel === p 
                              ? 'border-blue-600 bg-blue-100 text-blue-900 font-semibold' 
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Injuries, Sensitivities, or Focus Areas</label>
                    <textarea
                      value={guestNotes}
                      onChange={(e) => setGuestNotes(e.target.value)}
                      placeholder="e.g. Focus on neck and shoulder knots from computer work, avoid lavender scent..."
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Payment Options */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                      Payment &amp; Deposit
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setPaymentOption('deposit')}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          paymentOption === 'deposit'
                            ? 'border-blue-600 bg-white ring-1 ring-blue-600 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Pay $50 Hold Deposit</span>
                          <span className="text-xs font-mono font-bold text-blue-700">$50.00</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Remaining balance of ${balanceAtCheckin} paid upon check-in at the spa.
                        </p>
                      </div>

                      <div
                        onClick={() => setPaymentOption('full')}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          paymentOption === 'full'
                            ? 'border-blue-600 bg-white ring-1 ring-blue-600 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Prepay in Full</span>
                          <span className="text-xs font-mono font-bold text-blue-700">${total}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Seamless cashless arrival and departure. 100% refundable up to 24h prior.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Final Booking Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back: Date &amp; Time</span>
                  </button>

                  <button
                    disabled={isSubmitting}
                    onClick={handleCompleteBooking}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Securing Slot &amp; Dispatching Alerts...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Reservation (${amountToPayNow})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS / CONFIRMATION DISPLAY */}
            {step === 4 && confirmedBooking && (
              <div className="max-w-xl mx-auto text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    Appointment Confirmed &amp; Dispatched
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">
                    You're Scheduled for Sanctuary Rest!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Thank you, {confirmedBooking.client.fullName}. We look forward to welcoming you.
                  </p>
                </div>

                {/* Reference Code Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Confirmation Code</span>
                  <div className="text-2xl font-mono font-bold tracking-widest text-blue-600">
                    {confirmedBooking.confirmationCode}
                  </div>
                  <p className="text-xs text-slate-700 font-medium pt-1">
                    {confirmedBooking.serviceName} • {confirmedBooking.date} at {confirmedBooking.startTime}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Suite {confirmedBooking.roomNumber} with {confirmedBooking.therapistName}
                  </p>
                </div>

                {/* Notification Delivery Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">Email Receipt Sent</span>
                      <span className="text-slate-500 text-[11px] truncate block">{confirmedBooking.client.email}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">SMS Reminder Scheduled</span>
                      <span className="text-slate-500 text-[11px] block">{confirmedBooking.client.phone || 'Text alert enabled'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      setConfirmedBooking(null);
                      setSelectedSlotTime('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Book Another Session
                  </button>

                  <button
                    onClick={() => {
                      setLookupQuery(confirmedBooking.confirmationCode);
                      setPanelMode('manage');
                      handleSearchBookings();
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Manage Reservation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: MY RESERVATIONS (CLIENT SELF-SERVICE) */}
      {panelMode === 'manage' && (
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-sm font-bold text-slate-900 text-center">Look Up Your Reservations</h3>
            <p className="text-xs text-slate-500 text-center">
              Enter your email address, mobile phone number, or confirmation code to manage appointments.
            </p>

            <form onSubmit={handleSearchBookings} className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. SRN-10842 or sarah@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                {isLookingUp ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {rescheduleSuccess && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2 max-w-lg mx-auto">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{rescheduleSuccess}</span>
            </div>
          )}

          {lookupError && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl text-center max-w-lg mx-auto">
              <p className="font-semibold">{lookupError}</p>
            </div>
          )}

          {/* List of user bookings */}
          <div className="space-y-4 max-w-2xl mx-auto">
            {userBookings.map(booking => {
              const isReschedulingThis = reschedulingBooking?.id === booking.id;
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                        Ref: {booking.confirmationCode}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{booking.serviceName}</h4>
                    </div>

                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full self-start sm:self-auto ${
                      booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date</span>
                      <span className="font-semibold text-slate-800">{booking.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Time</span>
                      <span className="font-semibold text-slate-800">{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Specialist</span>
                      <span className="font-semibold text-slate-800">{booking.therapistName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">SMS Notifications</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        Enabled
                      </span>
                    </div>
                  </div>

                  {/* Rescheduling Drawer if active */}
                  {isReschedulingThis ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Select New Date &amp; Time</span>
                        <button
                          onClick={() => setReschedulingBooking(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-1">New Date</label>
                          <input
                            type="date"
                            value={newRescheduleDate}
                            onChange={(e) => setNewRescheduleDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-1">New Time Slot</label>
                          <input
                            type="time"
                            value={newRescheduleTime}
                            onChange={(e) => setNewRescheduleTime(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveReschedule(booking.id)}
                        disabled={!newRescheduleDate || !newRescheduleTime}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                      >
                        Confirm Rescheduled Session
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => {
                              setReschedulingBooking(booking);
                              setNewRescheduleDate(booking.date);
                              setNewRescheduleTime(booking.startTime);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Reschedule Slot
                          </button>

                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Cancel Session
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW C: DIGITAL SUKI PASS (CUSTOMER LOYALTY CARD) */}
      {panelMode === 'loyalty' && (
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="max-w-lg mx-auto space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1e1045] text-[#F0D204] flex items-center justify-center mx-auto shadow-md border border-yellow-400/40">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Your Nuat Thai Suki Digital Card</h3>
            <p className="text-xs text-slate-500">
              Check your stamp collection, redeemable complimentary massage vouchers, and history.
            </p>

            <div className="flex gap-2 pt-1 text-left">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={loyaltyQuery}
                  onChange={(e) => setLoyaltyQuery(e.target.value)}
                  placeholder="Enter phone number or card # (e.g. NT-SUKI-88401)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#1e1045]/30"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchLoyalty()}
                disabled={loyaltyLoading}
                className="px-4 py-2 bg-[#1e1045] hover:bg-[#2c1766] text-[#F0D204] rounded-lg text-xs font-bold transition shadow-xs cursor-pointer border border-yellow-400/40"
              >
                {loyaltyLoading ? 'Searching...' : 'Lookup Card'}
              </button>
            </div>

            {/* Quick Demo Pre-fill shortcuts */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500">
              <span>Quick Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setLoyaltyQuery('0917-882-9912');
                  handleSearchLoyalty('0917-882-9912');
                }}
                className="underline text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
              >
                Maria Santos (Gold VIP • 8 stamps)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setLoyaltyQuery('0918-554-1029');
                  handleSearchLoyalty('0918-554-1029');
                }}
                className="underline text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
              >
                Angelo Reyes (Silver • 5 stamps)
              </button>
            </div>
          </div>

          {loyaltyError && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl text-center max-w-lg mx-auto">
              <p className="font-semibold">{loyaltyError}</p>
            </div>
          )}

          {/* Render Active Customer Loyalty Card */}
          {loyaltyCard && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* The Physical Card Visual */}
              <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1e1045] via-[#2a135e] to-[#12082b] text-white shadow-xl border border-yellow-400/40 relative overflow-hidden">
                {/* Nuat Thai Watermark */}
                <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none text-yellow-300">
                  <Award className="w-52 h-52" />
                </div>

                {/* Top Row */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F0D204] text-[#1e1045] flex items-center justify-center font-black text-lg shadow-md border border-yellow-200">
                      NT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black tracking-wider font-serif text-[#F0D204] uppercase">
                          NUAT THAI
                        </span>
                        <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wider backdrop-blur-xs">
                          {loyaltyCard.tier}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-purple-200 font-medium">
                        AUTHENTIC THAI FOOT &amp; BODY MASSAGE &bull; VIP SUKI PASS
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {loyaltyCard.status}
                  </span>
                </div>

                {/* Member Info */}
                <div className="mt-5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-yellow-300/80 tracking-widest block">
                      Member Name
                    </span>
                    <span className="text-xl font-bold tracking-tight text-white block">
                      {loyaltyCard.customerName}
                    </span>
                    <span className="text-xs text-purple-200 mt-0.5 block font-mono">
                      {loyaltyCard.customerPhone} &bull; {loyaltyCard.homeBranch.toUpperCase()} Branch
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-yellow-300/80 tracking-widest block">
                      Membership No.
                    </span>
                    <span className="font-mono text-base font-bold text-yellow-300 tracking-wider">
                      {loyaltyCard.cardNumber}
                    </span>
                  </div>
                </div>

                {/* 10-Stamp Board */}
                <div className="mt-5 bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#F0D204]" />
                      <span>Nuat Thai 10-Stamp Rewards Card</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      {loyaltyCard.stamps} / {loyaltyCard.stampsTarget} Stamps
                    </span>
                  </div>

                  {/* Stamp Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                    {Array.from({ length: 10 }).map((_, index) => {
                      const slotNumber = index + 1;
                      const isStamped = slotNumber <= loyaltyCard.stamps;
                      const isMilestone = slotNumber === 10;

                      return (
                        <div
                          key={slotNumber}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center transition relative ${
                            isStamped
                              ? 'bg-[#F0D204] text-[#1e1045] shadow-md font-bold scale-100 border border-yellow-200'
                              : isMilestone
                              ? 'bg-purple-900/70 border-2 border-dashed border-[#F0D204] text-yellow-300 animate-pulse'
                              : 'bg-white/5 border border-dashed border-white/20 text-white/50'
                          }`}
                        >
                          {isStamped ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-black uppercase">#{slotNumber}</span>
                            </>
                          ) : isMilestone ? (
                            <>
                              <Gift className="w-3.5 h-3.5 text-[#F0D204]" />
                              <span className="text-[7px] font-black uppercase">FREE</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-white/40">{slotNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-200/90 pt-1">
                    <span>Target: 10 stamps = <strong>FREE 60m Authentic Thai Body Massage</strong></span>
                    <span className="font-bold text-[#F0D204]">
                      {loyaltyCard.stamps >= 10 ? 'Eligible for Free Massage!' : `${10 - loyaltyCard.stamps} sessions away`}
                    </span>
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-purple-100 relative z-10">
                  <div className="flex items-center gap-3">
                    <span><strong>{loyaltyCard.points}</strong> Points</span>
                    <span>&bull;</span>
                    <span><strong>{loyaltyCard.totalVisits}</strong> Visits</span>
                    <span>&bull;</span>
                    <span><strong>₱{loyaltyCard.lifetimeSpend.toLocaleString()}</strong> Spend</span>
                  </div>
                  <span className="text-[10px] text-purple-300">
                    Valid thru: {new Date(loyaltyCard.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Earned Rewards List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span>Available Complimentary Vouchers &amp; Rewards</span>
                </h4>

                {loyaltyCard.rewards.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No active rewards available right now. Collect stamps on your visits to unlock free sessions.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {loyaltyCard.rewards.map(r => (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          r.status === 'available'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{r.name}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase ${
                              r.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                        </div>
                        {r.status === 'available' && (
                          <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg shrink-0">
                            Ready at Front Desk
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Audit Log for Transparency */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-[#1e1045]" />
                    <span>Card Stamp &amp; Edit Trails History ({loyaltyCard.auditTrail.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Admin verified records</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {loyaltyCard.auditTrail.map((t, idx) => (
                    <div key={t.id || idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{t.fieldChanged}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        {t.previousValue} &rarr; <strong className="text-[#1e1045]">{t.newValue}</strong>
                      </div>
                      <p className="text-[11px] text-purple-900 italic bg-purple-50/70 p-1.5 rounded border border-purple-100">
                        &ldquo;{t.reason}&rdquo; &bull; <span className="font-sans text-[10px] text-purple-700">{t.adminName}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
