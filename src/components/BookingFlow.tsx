import React, { useState, useEffect } from 'react';
import { 
  Check, Clock, DollarSign, Calendar as CalendarIcon, User, Sparkles, 
  ChevronRight, ArrowLeft, ShieldCheck, CreditCard, Lock, Mail, 
  MapPin, Heart, AlertCircle, Info, RefreshCw, Star
} from 'lucide-react';
import { 
  MassageService, 
  AddonOption, 
  Therapist, 
  TimeSlot, 
  Appointment, 
  PressurePreference,
  Branch
} from '../types';
import { MASSAGE_SERVICES, ADDON_OPTIONS, NUAT_THAI_BRANCHES } from '../data/initialData';
import { BookingConfirmationView } from './BookingConfirmationView';

interface BookingFlowProps {
  therapists: Therapist[];
  onBookingCreated: (apt: Appointment) => void;
  onViewEmails: () => void;
  services?: MassageService[];
  branches?: Branch[];
  selectedBranch?: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  therapists,
  onBookingCreated,
  onViewEmails,
  services = MASSAGE_SERVICES,
  branches = NUAT_THAI_BRANCHES,
  selectedBranch = 'bgc'
}) => {
  const currentServices = services && services.length > 0 ? services : MASSAGE_SERVICES;
  const currentBranches = branches && branches.length > 0 ? branches : NUAT_THAI_BRANCHES;

  // Step State (1: Service, 2: Therapist, 3: Date & Slot, 4: Intake & Addons, 5: Payment, 6: Confirmed)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<MassageService>(currentServices[0] || MASSAGE_SERVICES[0]);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(60);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('any');

  // Keep selected service valid if services list changes
  useEffect(() => {
    if (!currentServices.some(s => s.id === selectedService.id)) {
      setSelectedService(currentServices[0] || MASSAGE_SERVICES[0]);
    }
  }, [currentServices]);
  
  // Date & Slot selection
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  
  // Availability Slots from server
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotFetchError, setSlotFetchError] = useState<string | null>(null);

  // Intake & Addons
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [pressurePreference, setPressurePreference] = useState<PressurePreference>('Medium / Balanced');
  const [focusAreas, setFocusAreas] = useState<string[]>(['Upper Back & Shoulders']);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [clientFullName, setClientFullName] = useState<string>('Sarah Jenkins');
  const [clientEmail, setClientEmail] = useState<string>('tjfcc864@gmail.com');
  const [clientPhone, setClientPhone] = useState<string>('+1 (555) 234-8891');
  const [receiveSmsReminders, setReceiveSmsReminders] = useState<boolean>(true);
  const [clientNotes, setClientNotes] = useState<string>('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'apple_pay' | 'google_pay' | 'gift_card'>('credit_card');
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('842');
  const [cardZip, setCardZip] = useState<string>('94103');
  const [tipOption, setTipOption] = useState<number>(20); // percentage or custom
  const [customTip, setCustomTip] = useState<string>('');
  const [promoCodeInput, setPromoCodeInput] = useState<string>('RELAX20');
  const [appliedPromo, setAppliedPromo] = useState<string>('RELAX20');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Created appointment result
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Fetch real-time available slots whenever date, therapist, or duration changes
  const fetchAvailability = async () => {
    setLoadingSlots(true);
    setSlotFetchError(null);
    try {
      const queryParams = new URLSearchParams({
        date: selectedDate,
        therapistId: selectedTherapistId,
        duration: String(selectedDurationMinutes)
      });
      const res = await fetch(`/api/availability?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to synchronize availability');
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err: any) {
      console.error(err);
      setSlotFetchError('Could not sync live availability. Showing cached slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (currentStep >= 3) {
      fetchAvailability();
    }
  }, [selectedDate, selectedTherapistId, selectedDurationMinutes, currentStep]);

  // Pricing calculations
  const activeDurationOption = selectedService.durations.find(d => d.durationMinutes === selectedDurationMinutes) || selectedService.durations[0];
  const serviceBasePrice = activeDurationOption ? activeDurationOption.price : 115;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  
  let discountAmount = 0;
  if (appliedPromo.toUpperCase() === 'RELAX20') discountAmount = 20;
  else if (appliedPromo.toUpperCase() === 'FIRSTVISIT') discountAmount = (serviceBasePrice + addonsTotal) * 0.15;
  else if (appliedPromo.toUpperCase() === 'WELLNESS') discountAmount = 15;

  const subtotal = Math.max(0, serviceBasePrice + addonsTotal - discountAmount);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  
  let tipAmount = 0;
  if (tipOption === -1) {
    tipAmount = parseFloat(customTip) || 0;
  } else if (tipOption > 0) {
    tipAmount = Math.round((subtotal * (tipOption / 100)) * 100) / 100;
  }

  const grandTotal = subtotal + tax + tipAmount;
  const depositAmount = Math.round(grandTotal * 0.35 * 100) / 100;
  const amountToChargeNow = paymentType === 'deposit' ? depositAmount : grandTotal;
  const balanceDueLater = paymentType === 'deposit' ? Math.round((grandTotal - depositAmount) * 100) / 100 : 0;

  // Handler for toggle addon
  const toggleAddon = (addon: AddonOption) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Handler for toggle focus area
  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  // Final Submit & Payment
  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFullName || !clientEmail) {
      setPaymentError('Please provide your full name and email for the booking confirmation.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const payload = {
        serviceId: selectedService.id,
        durationMinutes: selectedDurationMinutes,
        therapistId: selectedTherapistId,
        date: selectedDate,
        startTime: selectedSlotTime,
        addons: selectedAddons,
        client: {
          fullName: clientFullName,
          email: clientEmail,
          phone: clientPhone,
          receiveSmsReminders,
          pressurePreference,
          focusAreas,
          medicalConditions,
          notes: clientNotes
        },
        paymentMethod,
        paymentType,
        tipAmount,
        promoCode: appliedPromo,
        cardLast4: cardNumber.replace(/\D/g, '').slice(-4) || '4242',
        cardBrand: paymentMethod === 'apple_pay' ? 'Apple Pay' : paymentMethod === 'google_pay' ? 'Google Pay' : 'Visa'
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to process booking');
      }

      const result = await res.json();
      setConfirmedAppointment(result.appointment);
      onBookingCreated(result.appointment);
      setCurrentStep(6);
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || 'Payment simulation failed. Please retry.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 14-day upcoming dates list
  const nextDates = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const iso = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { iso, dayName, monthDay, isToday: idx === 0 };
  });

  const resolvedTherapist = therapists.find(t => t.id === selectedTherapistId);

  // If already confirmed, render the Confirmation View
  if (currentStep === 6 && confirmedAppointment) {
    return (
      <BookingConfirmationView 
        appointment={confirmedAppointment}
        onBookAnother={() => {
          setConfirmedAppointment(null);
          setCurrentStep(1);
          setSelectedSlotTime('');
        }}
        onViewEmailCenter={onViewEmails}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100/80 px-2.5 py-1 rounded-full">
              Reservation Concierge
            </span>
            <span className="text-slate-400 text-xs">• Step {currentStep} of 5</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>256-Bit Encrypted Booking</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            'Treatment',
            'Specialist',
            'Time & Slot',
            'Preferences',
            'Payment'
          ].map((label, idx) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep > idx + 1 
                    ? 'bg-blue-600' 
                    : currentStep === idx + 1 
                    ? 'bg-blue-600' 
                    : 'bg-slate-200'
                }`} 
              />
              <span className={`text-[11px] font-medium hidden sm:block ${
                currentStep === idx + 1 ? 'text-blue-950 font-bold' : 'text-slate-500'
              }`}>
                {idx + 1}. {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: SELECT SERVICE & DURATION */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-sans text-slate-900 font-bold">Select Your Massage Therapy</h2>
            <p className="text-sm text-slate-600 mt-1">
              Choose from our signature restorative treatments. Each session is tailored by licensed massage practitioners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentServices.map((service) => {
              const isSelected = selectedService.id === service.id;
              return (
                <div
                  key={service.id}
                  id={`service-card-${service.id}`}
                  onClick={() => setSelectedService(service)}
                  className={`rounded-xl border transition-all cursor-pointer overflow-hidden p-5 flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {service.popular && (
                          <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-1.5">
                            Most Requested
                          </span>
                        )}
                        <h3 className="text-lg font-sans font-bold text-slate-900">{service.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{service.tagline}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-1">
                        {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {service.pressureLevels.map(p => (
                        <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Durations and Pricing for this service */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Available Durations:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.durations.map(d => {
                        const isDurationActive = isSelected && selectedDurationMinutes === d.durationMinutes;
                        return (
                          <button
                            key={d.durationMinutes}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedService(service);
                              setSelectedDurationMinutes(d.durationMinutes);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                              isDurationActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{d.durationMinutes} min</span>
                            <span className="opacity-80">• ${d.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Complimentary organic botanical aromatherapy included with all sessions.</span>
            </div>
            <button
              id="btn-next-therapist"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-600 transition shadow flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Choose Specialist</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: CHOOSE THERAPIST */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-sans text-slate-900 font-bold">Select Your Licensed Practitioner</h2>
            <p className="text-sm text-slate-600 mt-1">
              Select an experienced therapist or choose "First Available Specialist" for maximum schedule flexibility.
            </p>
          </div>

          {/* Any Available Option Card */}
          <div
            id="therapist-card-any"
            onClick={() => setSelectedTherapistId('any')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedTherapistId === 'any'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-800 flex items-center justify-center text-white shadow-inner">
                <Sparkles className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-slate-900">First Available Specialist</h4>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Allows our smart scheduler to find you the earliest and most convenient time slot.
                </p>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
              {selectedTherapistId === 'any' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
            </div>
          </div>

          {/* Therapist List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {therapists.map((therapist) => {
              const isSelected = selectedTherapistId === therapist.id;
              return (
                <div
                  key={therapist.id}
                  id={`therapist-card-${therapist.id}`}
                  onClick={() => setSelectedTherapistId(therapist.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={therapist.avatar} 
                          alt={therapist.name} 
                          referrerPolicy="no-referrer"
                          className="w-13 h-13 rounded-xl object-cover shadow-sm border border-slate-200" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-sans font-bold text-slate-900">{therapist.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{therapist.licenseNumber}</span>
                          </div>
                          <p className="text-xs text-blue-700 font-medium">{therapist.title}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="font-semibold text-slate-800">{therapist.rating}</span>
                            <span className="text-slate-400">({therapist.reviewCount} verified reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3.5 leading-relaxed line-clamp-3">
                      {therapist.bio}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {therapist.specialties.map(spec => (
                      <span key={spec} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Treatment</span>
            </button>
            <button
              id="btn-next-datetime"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-600 transition shadow flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Date &amp; Time</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: DATE & REAL-TIME TIME SLOT PICKER */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-sans text-slate-900 font-bold">Select Date &amp; Time</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Availability updates in real time based on therapist shifts, active bookings, and scheduled breaks.
                </p>
              </div>
              <button
                onClick={fetchAvailability}
                className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                title="Refresh Availability"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
                <span>Sync Slots</span>
              </button>
            </div>
          </div>

          {/* Date Selector Row */}
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2 block">
              1. Choose Date (Next 14 Days)
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {nextDates.map(d => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.iso);
                      setSelectedSlotTime('');
                    }}
                    className={`min-w-[85px] p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-700 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {d.isToday ? 'Today' : d.dayName}
                    </span>
                    <span className="text-sm font-bold mt-0.5">{d.monthDay}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 block">
                2. Select Real-Time Time Slot ({selectedDurationMinutes} min session)
              </label>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                  Booked
                </span>
              </div>
            </div>

            {loadingSlots ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Synchronizing live therapist schedules...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No open appointment slots found for this date.</p>
                <p className="text-[11px] text-slate-400 mt-1">Please select another date or choose 'First Available Specialist'.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-700 text-white shadow-md ring-2 ring-blue-600/30'
                          : slot.available
                          ? 'border-slate-200 bg-white text-slate-800 hover:border-blue-600 hover:bg-blue-50/50'
                          : 'border-slate-100 bg-slate-100/60 text-slate-400 cursor-not-allowed line-through'
                      }`}
                    >
                      <span className="text-sm font-bold">{slot.time}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-200' : slot.available ? 'text-blue-600' : 'text-slate-400'}`}>
                        {slot.available ? 'Open' : 'Unavailable'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Box */}
          {selectedSlotTime && (
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-semibold text-blue-950 block">
                    Slot Selected: {selectedDate} at {selectedSlotTime}
                  </span>
                  <span className="text-blue-600">
                    {selectedService.name} • {selectedDurationMinutes} minutes • {resolvedTherapist?.name || 'Assigned Specialist'}
                  </span>
                </div>
              </div>
              <span className="text-blue-950 font-bold">${serviceBasePrice}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Specialist</span>
            </button>
            <button
              id="btn-next-preferences"
              disabled={!selectedSlotTime}
              onClick={() => setCurrentStep(4)}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition shadow flex items-center gap-2 ${
                selectedSlotTime
                  ? 'bg-blue-700 text-white hover:bg-blue-600 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Next: Enhancements &amp; Intake</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: ENHANCEMENTS & CLIENT INTAKE */}
      {/* ======================================================== */}
      {currentStep === 4 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-sans text-slate-900 font-bold">Treatment Enhancements &amp; Intake</h2>
            <p className="text-sm text-slate-600 mt-1">
              Customize your bodywork experience with restorative enhancements and tell your therapist about your preferences.
            </p>
          </div>

          {/* Add-on Enhancements */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">
              Optional Botanical &amp; Hydrotherapy Add-ons
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDON_OPTIONS.map((addon) => {
                const isSelected = selectedAddons.some(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-slate-900 text-sm">{addon.name}</span>
                        <span className="text-xs font-bold text-blue-700">+${addon.price}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addon.description}</p>
                    </div>
                    <div className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pressure Preference */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Desired Pressure Level
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Light / Gentle', 'Medium / Balanced', 'Firm', 'Deep Tissue / Intensive'] as PressurePreference[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPressurePreference(level)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                    pressurePreference === level
                      ? 'border-blue-600 bg-blue-700 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Target Focus Areas (Select All That Apply)
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Upper Back & Shoulders',
                'Neck & Cervical Spine',
                'Lower Back & Lumbar',
                'Hips & Glutes',
                'Hamstrings & Calves',
                'Feet & Soles',
                'Arms & Hands',
                'Jaw & Cranial Acupressure'
              ].map((area) => {
                const isSelected = focusAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocusArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-100/70 text-blue-950 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Contact & Notes */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-sans font-bold text-slate-900">Guest Information for Confirmation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Email (for Confirmation &amp; Receipt) *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Mobile Phone</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* SMS Reminders Opt-in Toggle */}
            <div className="flex items-start gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <input
                type="checkbox"
                id="intake-sms-toggle"
                checked={receiveSmsReminders}
                onChange={(e) => setReceiveSmsReminders(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="intake-sms-toggle" className="text-xs text-slate-700 cursor-pointer select-none">
                <span className="font-semibold text-slate-900 block">Receive appointment reminders via text (SMS)</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Receive a 24-hour reminder text, directions, and instant booking confirmation on your mobile phone in addition to email.
                </span>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Notes, Injuries, or Sensitivities for Therapist</label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Mention any tight muscles, desk slouching fatigue, pregnancy trimester, or essential oil allergies..."
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Date &amp; Time</span>
            </button>
            <button
              id="btn-next-checkout"
              disabled={!clientFullName || !clientEmail}
              onClick={() => setCurrentStep(5)}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition shadow flex items-center gap-2 ${
                clientFullName && clientEmail
                  ? 'bg-blue-700 text-white hover:bg-blue-600 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Next: Secure Payment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: SECURE ONLINE PAYMENT PROCESSING */}
      {/* ======================================================== */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-sans text-slate-900 font-bold">Secure Online Checkout</h2>
            <p className="text-sm text-slate-600 mt-1">
              Encrypted transaction processing. Choose full payment or hold with a 35% deposit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Payment Methods & Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Type Selection (Full vs Deposit) */}
              <div className="bg-slate-100 p-1.5 rounded-xl grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('full')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paymentType === 'full'
                      ? 'bg-white text-blue-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pay in Full (${grandTotal.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('deposit')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paymentType === 'deposit'
                      ? 'bg-white text-blue-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reserve with 35% Deposit (${depositAmount.toFixed(2)})
                </button>
              </div>

              {/* Payment Methods */}
              <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-sans font-bold text-slate-900">Select Payment Method</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PCI-DSS Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'apple_pay'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold"> Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('google_pay')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'google_pay'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold">G Pay</span>
                  </button>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 •••• •••• 4242"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] uppercase font-bold text-slate-400">
                          Visa
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Expiration</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">CVC Code</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="CVC"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Billing Zip</label>
                        <input
                          type="text"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value)}
                          placeholder="94103"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod !== 'credit_card' && (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-600 border border-dashed border-slate-300">
                    <p className="font-semibold text-slate-800">
                      {paymentMethod === 'apple_pay' ? 'Apple Pay Express Checkout' : 'Google Pay 1-Click Checkout'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Instant biometric token authorization ready.
                    </p>
                  </div>
                )}
              </div>

              {/* Therapist Gratuity / Tip Selection */}
              <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-sans font-bold text-slate-900">Therapist Gratuity</h3>
                  <span className="text-xs text-slate-500">100% goes directly to your therapist</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {[15, 20, 25, 30].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setTipOption(pct);
                        setCustomTip('');
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        tipOption === pct
                          ? 'border-blue-600 bg-blue-700 text-white font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pct}% (${Math.round((subtotal * (pct / 100)) * 100) / 100})
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setTipOption(0)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      tipOption === 0
                        ? 'border-blue-600 bg-blue-700 text-white font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cash on Arrival
                  </button>
                </div>
              </div>

              {/* Promo code */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="Promo Code (e.g. RELAX20, FIRSTVISIT)"
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 uppercase tracking-wider font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 w-64"
                />
                <button
                  type="button"
                  onClick={() => setAppliedPromo(promoCodeInput.trim().toUpperCase())}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition cursor-pointer"
                >
                  Apply
                </button>
                {discountAmount > 0 && (
                  <span className="text-xs font-semibold text-blue-600">
                    ✓ Code '{appliedPromo}' applied (-${discountAmount.toFixed(2)})
                  </span>
                )}
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>

            {/* Right Col: Appointment Summary & Total */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-xl flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-1">
                  Reservation Summary
                </span>
                <h3 className="text-lg font-sans font-bold text-slate-100">{selectedService.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDurationMinutes} Min • {selectedDate} at {selectedSlotTime}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Therapist</span>
                    <span className="font-semibold text-slate-200">{resolvedTherapist?.name || 'Any Specialist'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pressure</span>
                    <span className="font-semibold text-slate-200">{pressurePreference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest</span>
                    <span className="font-semibold text-slate-200">{clientFullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confirmation Email</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[170px]">{clientEmail}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Treatment</span>
                    <span>${serviceBasePrice.toFixed(2)}</span>
                  </div>
                  {selectedAddons.map(a => (
                    <div key={a.id} className="flex justify-between text-slate-300">
                      <span>Enhancement: {a.name}</span>
                      <span>+${a.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-blue-400 font-semibold">
                      <span>Discount ({appliedPromo})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Sales Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Therapist Gratuity</span>
                      <span>${tipAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline font-bold text-slate-100 text-base">
                    <span>Total Service Value</span>
                    <span className="text-xl font-sans text-blue-400">${grandTotal.toFixed(2)}</span>
                  </div>

                  {paymentType === 'deposit' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-blue-700/60 text-xs">
                      <div className="flex justify-between text-blue-300 font-semibold">
                        <span>Due Online Now (35% Deposit)</span>
                        <span>${depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                        <span>Balance Due at Reception</span>
                        <span>${balanceDueLater.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  id="btn-pay-and-confirm"
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleCompleteBooking}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-700 text-white font-bold text-sm tracking-wide hover:from-blue-500 hover:to-teal-600 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize ${amountToChargeNow.toFixed(2)} &amp; Confirm</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 leading-tight">
                  By confirming, an automated email receipt and appointment calendar invite will be immediately dispatched to {clientEmail}. Free cancellation up to 12 hours prior.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Intake &amp; Add-ons</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
