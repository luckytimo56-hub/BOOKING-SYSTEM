import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  MASSAGE_SERVICES, 
  ADDON_OPTIONS, 
  THERAPISTS, 
  INITIAL_APPOINTMENTS,
  MOCK_MONTHLY_TREND,
  INITIAL_LOYALTY_CARDS,
  NUAT_THAI_BRANCHES
} from './src/data/initialData';
import { 
  Appointment, 
  Therapist, 
  ShiftOverride, 
  EmailLog, 
  AnalyticsSummary,
  TherapistPerformanceStat,
  NotificationSettings,
  SmsLog,
  LoyaltyCard,
  LoyaltyAuditTrail,
  LoyaltyReward,
  LoyaltyTier,
  LoyaltyAuditAction,
  Branch,
  MassageService
} from './src/types';
import { generateBookingConfirmationHtml } from './src/utils/emailGenerator';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// In-memory data stores for real-time synchronization
let appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
let therapists: Therapist[] = [...THERAPISTS];
let branches: Branch[] = JSON.parse(JSON.stringify(NUAT_THAI_BRANCHES));
let services: MassageService[] = JSON.parse(JSON.stringify(MASSAGE_SERVICES));
let shiftOverrides: ShiftOverride[] = [];
let emailLogs: EmailLog[] = [];
let loyaltyCards: LoyaltyCard[] = JSON.parse(JSON.stringify(INITIAL_LOYALTY_CARDS));
let notificationSettings: NotificationSettings = {
  smsEnabled: true,
  emailEnabled: true,
  reminder24hSms: true,
  instantConfirmationSms: true,
  reminder2hSms: true,
  senderPhone: '+1 (415) 890-7721',
  smsGateway: 'Twilio SMS Cloud Gateway (Active)'
};

let smsLogs: SmsLog[] = [
  {
    id: 'sms-1',
    appointmentId: INITIAL_APPOINTMENTS[0]?.id || 'apt-1',
    confirmationCode: INITIAL_APPOINTMENTS[0]?.confirmationCode || 'SRN-10842',
    recipientPhone: INITIAL_APPOINTMENTS[0]?.client.phone || '+1 (555) 234-5678',
    recipientName: INITIAL_APPOINTMENTS[0]?.client.fullName || 'Elena Rostova',
    message: `Zenith Spa: Confirmed! Deep Tissue Restorative on ${INITIAL_APPOINTMENTS[0]?.date || '2026-09-08'} at 09:00 AM with Sarah Jenkins. Ref: ${INITIAL_APPOINTMENTS[0]?.confirmationCode || 'SRN-10842'}. Suite 200, 450 Lotus Blossom Way.`,
    sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'booking_confirmation',
    status: 'delivered'
  },
  {
    id: 'sms-2',
    recipientPhone: '+1 (555) 345-6789',
    recipientName: 'Robert Chen',
    message: `Zenith Spa Reminder: Your 60m Deep Tissue session is tomorrow at 09:00 AM with Sarah J. Suite 200. Reply C to confirm or call (415) 555-0192 to reschedule.`,
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'reminder_24h',
    status: 'delivered'
  }
];
const slotLocks: { [key: string]: { therapistId: string; date: string; time: string; expiresAt: number } } = {};

// Initialize initial email logs for pre-existing appointments
appointments.forEach(apt => {
  emailLogs.push({
    id: `email-${apt.id}`,
    appointmentId: apt.id,
    confirmationCode: apt.confirmationCode,
    recipientEmail: apt.client.email,
    recipientName: apt.client.fullName,
    subject: `Confirmed: ${apt.serviceName} at Serenity Sanctuary (${apt.confirmationCode})`,
    sentAt: apt.emailSentAt || apt.createdAt,
    type: 'booking_confirmation',
    status: 'delivered',
    htmlBody: generateBookingConfirmationHtml(apt)
  });
});

// Helper: Calculate end time from start time (HH:MM) and duration in minutes
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

// Helper: check if two time ranges overlap
function doTimesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return (startA < endB) && (endA > startB);
}

// ==========================================
// 1. AVAILABILITY SYNC & SLOTS API
// ==========================================
app.get('/api/availability', (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const requestedTherapistId = req.query.therapistId as string; // or 'any' / undefined
  const duration = parseInt((req.query.duration as string) || '60', 10);

  const reqDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = reqDate.getDay(); // 0 = Sun, 1 = Mon...

  // Filter active therapists who work on this day
  const candidateTherapists = therapists.filter(t => {
    if (!t.isActive) return false;
    if (requestedTherapistId && requestedTherapistId !== 'any' && t.id !== requestedTherapistId) {
      return false;
    }
    // Check shift overrides for this date
    const override = shiftOverrides.find(so => so.therapistId === t.id && so.date === date);
    if (override && override.isOff) return false;
    // Check default working days
    if (!override && !t.workingDays.includes(dayOfWeek)) return false;
    return true;
  });

  // Generate standard 30-minute interval slots between 09:00 and 19:30
  const possibleSlotTimes: string[] = [];
  for (let h = 9; h < 20; h++) {
    possibleSlotTimes.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 19) {
      possibleSlotTimes.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  const now = Date.now();
  // Clear expired locks
  for (const lockKey in slotLocks) {
    if (slotLocks[lockKey].expiresAt < now) {
      delete slotLocks[lockKey];
    }
  }

  // Active appointments for date (exclude cancelled)
  const dateAppointments = appointments.filter(a => a.date === date && a.status !== 'cancelled');

  const slots = possibleSlotTimes.map(time => {
    const slotEndTime = calculateEndTime(time, duration);

    // Find which therapists are available for this slot
    const availableTherapistIds = candidateTherapists.filter(t => {
      const override = shiftOverrides.find(so => so.therapistId === t.id && so.date === date);
      const shiftStart = override?.shiftStart || t.shiftStart;
      const shiftEnd = override?.shiftEnd || t.shiftEnd;
      const breakStart = override?.breakStart || t.breakStart;
      const breakEnd = override?.breakEnd || t.breakEnd;

      // 1. Must fit within shift
      if (time < shiftStart || slotEndTime > shiftEnd) {
        return false;
      }

      // 2. Must not overlap with therapist break
      if (doTimesOverlap(time, slotEndTime, breakStart, breakEnd)) {
        return false;
      }

      // 3. Must not overlap with an existing booked appointment
      const hasConflict = dateAppointments.some(apt => {
        if (apt.therapistId !== t.id) return false;
        return doTimesOverlap(time, slotEndTime, apt.startTime, apt.endTime);
      });
      if (hasConflict) return false;

      // 4. Must not be currently locked by another client in checkout
      const lockKey = `${t.id}_${date}_${time}`;
      if (slotLocks[lockKey] && slotLocks[lockKey].expiresAt > now) {
        return false;
      }

      return true;
    }).map(t => t.id);

    return {
      time,
      available: availableTherapistIds.length > 0,
      therapistIds: availableTherapistIds,
      isLocked: false
    };
  });

  res.json({
    date,
    duration,
    therapistCount: candidateTherapists.length,
    slots
  });
});

// Temporary slot lock during checkout (expires after 10 minutes)
app.post('/api/availability/lock', (req, res) => {
  const { therapistId, date, time, durationMinutes } = req.body;
  if (!therapistId || !date || !time) {
    return res.status(400).json({ error: 'Missing slot coordinates' });
  }

  const lockKey = `${therapistId}_${date}_${time}`;
  slotLocks[lockKey] = {
    therapistId,
    date,
    time,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes hold
  };

  res.json({ success: true, lockKey, expiresAt: slotLocks[lockKey].expiresAt });
});

// ==========================================
// 2. BOOKINGS & APPOINTMENTS API
// ==========================================
app.get('/api/bookings', (req, res) => {
  const { date, therapistId, status, search } = req.query;
  let result = [...appointments];

  if (date) {
    result = result.filter(a => a.date === date);
  }
  if (therapistId && therapistId !== 'all') {
    result = result.filter(a => a.therapistId === therapistId);
  }
  if (status && status !== 'all') {
    result = result.filter(a => a.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(a => 
      a.confirmationCode.toLowerCase().includes(q) ||
      a.client.fullName.toLowerCase().includes(q) ||
      a.client.email.toLowerCase().includes(q) ||
      a.client.phone.includes(q) ||
      a.serviceName.toLowerCase().includes(q)
    );
  }

  // Sort by date and startTime descending
  result.sort((a, b) => {
    const dateTimeA = `${a.date}T${a.startTime}`;
    const dateTimeB = `${b.date}T${b.startTime}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  res.json(result);
});

app.get('/api/bookings/:idOrCode', (req, res) => {
  const { idOrCode } = req.params;
  const apt = appointments.find(a => 
    a.id === idOrCode || 
    a.confirmationCode.toLowerCase() === idOrCode.toLowerCase()
  );

  if (!apt) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json(apt);
});

// Create new appointment + payment processing + email dispatch
app.post('/api/bookings', (req, res) => {
  const {
    serviceId,
    durationMinutes,
    therapistId,
    date,
    startTime,
    addons = [],
    client,
    paymentMethod,
    paymentType = 'full', // 'full' or 'deposit'
    tipAmount = 0,
    promoCode
  } = req.body;

  if (!serviceId || !date || !startTime || !client?.fullName || !client?.email) {
    return res.status(400).json({ error: 'Missing required booking information' });
  }

  const service = services.find(s => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Determine duration and base price
  const durationOption = service.durations.find(d => d.durationMinutes === durationMinutes) || service.durations[0];
  const actualDuration = durationOption.durationMinutes;
  const servicePrice = durationOption.price;

  // Resolved therapist
  let assignedTherapist = therapists.find(t => t.id === therapistId);
  if (!assignedTherapist || therapistId === 'any') {
    // Pick first available active therapist for this day/slot
    const dateAppointments = appointments.filter(a => a.date === date && a.status !== 'cancelled');
    const endTime = calculateEndTime(startTime, actualDuration);
    assignedTherapist = therapists.find(t => {
      if (!t.isActive) return false;
      const isBooked = dateAppointments.some(a => a.therapistId === t.id && doTimesOverlap(startTime, endTime, a.startTime, a.endTime));
      return !isBooked;
    }) || therapists[0];
  }

  // Calculate pricing
  const addonsTotal = addons.reduce((sum: number, a: { price: number }) => sum + (a.price || 0), 0);
  let discount = 0;
  if (promoCode) {
    const code = promoCode.trim().toUpperCase();
    if (code === 'RELAX20') discount = 20;
    else if (code === 'FIRSTVISIT') discount = (servicePrice + addonsTotal) * 0.15;
    else if (code === 'WELLNESS') discount = 15;
  }

  const subtotal = Math.max(0, servicePrice + addonsTotal - discount);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const tip = Number(tipAmount) || 0;
  const total = subtotal + tax + tip;

  let amountPaid = total;
  let balanceDue = 0;
  if (paymentType === 'deposit') {
    amountPaid = Math.round(total * 0.35 * 100) / 100; // 35% deposit
    balanceDue = Math.round((total - amountPaid) * 100) / 100;
  }

  // Generate unique confirmation code: SRN-XXXXX
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const confirmationCode = `SRN-${randomNum}`;
  const appointmentId = `apt-${Date.now()}`;
  const endTime = calculateEndTime(startTime, actualDuration);

  // Simulated secure transaction
  const transactionId = `TXN_${Math.floor(100000000 + Math.random() * 900000000)}`;
  const authCode = `AUTH_${Math.floor(10000 + Math.random() * 90000)}`;

  const newAppointment: Appointment = {
    id: appointmentId,
    confirmationCode,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: actualDuration,
    therapistId: assignedTherapist.id,
    therapistName: assignedTherapist.name,
    therapistAvatar: assignedTherapist.avatar,
    date,
    startTime,
    endTime,
    roomNumber: assignedTherapist.roomNumber,
    addons: addons.map((a: { id: string; name: string; price: number }) => ({
      id: a.id,
      name: a.name,
      price: a.price
    })),
    client: {
      fullName: client.fullName,
      email: client.email,
      phone: client.phone || '+1 (555) 000-0000',
      pressurePreference: client.pressurePreference || 'Medium / Balanced',
      focusAreas: client.focusAreas || [],
      medicalConditions: client.medicalConditions || [],
      notes: client.notes || ''
    },
    pricing: {
      servicePrice,
      addonsTotal,
      discount,
      subtotal,
      tax,
      tip,
      total,
      amountPaid,
      balanceDue,
      paymentType
    },
    payment: {
      method: paymentMethod || 'credit_card',
      transactionId,
      authCode,
      paidAt: new Date().toISOString(),
      last4: req.body.cardLast4 || '4242',
      cardBrand: req.body.cardBrand || 'Visa Online'
    },
    status: req.body.status || 'confirmed',
    emailSent: req.body.status === 'pending' ? false : true,
    emailSentAt: req.body.status === 'pending' ? '' : new Date().toISOString(),
    createdAt: new Date().toISOString(),
    branchId: req.body.branchId || 'bgc'
  };

  // Add to appointments
  appointments.unshift(newAppointment);

  // Clear any existing slot lock
  const lockKey = `${assignedTherapist.id}_${date}_${startTime}`;
  delete slotLocks[lockKey];

  // Dispatch email log
  let emailLog: EmailLog;
  if (newAppointment.status === 'pending') {
    // Notify client that request is received and pending front desk review
    emailLog = {
      id: `email-${Date.now()}`,
      appointmentId: newAppointment.id,
      confirmationCode: newAppointment.confirmationCode,
      recipientEmail: newAppointment.client.email,
      recipientName: newAppointment.client.fullName,
      subject: `Nuat Thai Booking Received: ${newAppointment.serviceName} (${newAppointment.confirmationCode}) - Pending Confirmation`,
      sentAt: new Date().toISOString(),
      type: 'booking_received',
      status: 'delivered',
      htmlBody: `<div style="font-family: sans-serif; padding: 20px; color: #1e1045;">
        <h2>Nuat Thai Foot & Body Massage</h2>
        <p>Hello <strong>${newAppointment.client.fullName}</strong>,</p>
        <p>We received your booking request for <strong>${newAppointment.serviceName}</strong> on <strong>${newAppointment.date} at ${newAppointment.startTime}</strong> with <strong>${newAppointment.therapistName}</strong>.</p>
        <p>Our Front Desk Attendant is currently reviewing the pod assignment and therapist availability. You will receive an immediate confirmation once approved.</p>
        <p>Booking Reference: <strong>${newAppointment.confirmationCode}</strong></p>
      </div>`
    };
  } else {
    // Dispatch automated confirmed email log
    const emailHtml = generateBookingConfirmationHtml(newAppointment);
    emailLog = {
      id: `email-${Date.now()}`,
      appointmentId: newAppointment.id,
      confirmationCode: newAppointment.confirmationCode,
      recipientEmail: newAppointment.client.email,
      recipientName: newAppointment.client.fullName,
      subject: `Nuat Thai Booking Confirmed: ${newAppointment.serviceName} (${newAppointment.confirmationCode})`,
      sentAt: new Date().toISOString(),
      type: 'booking_confirmation',
      status: 'delivered',
      htmlBody: emailHtml
    };
  }
  emailLogs.unshift(emailLog);

  // Dispatch automated SMS log if enabled & client phone available
  let smsLog: SmsLog | undefined;
  const wantsSms = req.body.client?.receiveSmsReminders !== false;
  if (notificationSettings.smsEnabled && wantsSms && newAppointment.client.phone) {
    const smsMessage = newAppointment.status === 'pending'
      ? `Nuat Thai: We received your reservation request for ${newAppointment.serviceName} on ${newAppointment.date} at ${newAppointment.startTime}. Ref: ${newAppointment.confirmationCode}. Awaiting front desk approval.`
      : `Nuat Thai: Confirmed! ${newAppointment.serviceName} on ${newAppointment.date} at ${newAppointment.startTime} with ${newAppointment.therapistName}. Ref: ${newAppointment.confirmationCode}. Suite ${newAppointment.roomNumber}. See you soon!`;
    
    smsLog = {
      id: `sms-${Date.now()}`,
      appointmentId: newAppointment.id,
      confirmationCode: newAppointment.confirmationCode,
      recipientPhone: newAppointment.client.phone,
      recipientName: newAppointment.client.fullName,
      message: smsMessage,
      sentAt: new Date().toISOString(),
      type: newAppointment.status === 'pending' ? 'booking_received' : 'booking_confirmation',
      status: 'delivered'
    };
    smsLogs.unshift(smsLog);
    newAppointment.smsSent = true;
    newAppointment.smsSentAt = smsLog.sentAt;
  }

  res.status(201).json({
    success: true,
    appointment: newAppointment,
    emailNotification: {
      id: emailLog.id,
      recipient: emailLog.recipientEmail,
      subject: emailLog.subject,
      status: emailLog.status
    },
    smsNotification: smsLog ? {
      id: smsLog.id,
      recipient: smsLog.recipientPhone,
      status: smsLog.status
    } : null
  });
});

// Update appointment status (accept, decline, check in, complete, cancel, reschedule)
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    date, 
    startTime, 
    durationMinutes, 
    notes,
    roomNumber,
    therapistId,
    therapistName,
    therapistAvatar,
    declineReason,
    declinedBy,
    acceptedBy,
    frontDeskNotes
  } = req.body;
  const aptIndex = appointments.findIndex(a => a.id === id || a.confirmationCode === id);

  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const existing = appointments[aptIndex];
  const nowIso = new Date().toISOString();

  const updated: Appointment = {
    ...existing,
    ...(status ? { status } : {}),
    ...(date ? { date } : {}),
    ...(startTime ? { 
      startTime, 
      endTime: calculateEndTime(startTime, durationMinutes || existing.durationMinutes) 
    } : {}),
    ...(roomNumber ? { roomNumber } : {}),
    ...(therapistId ? { therapistId } : {}),
    ...(therapistName ? { therapistName } : {}),
    ...(therapistAvatar ? { therapistAvatar } : {}),
    ...(frontDeskNotes !== undefined ? { frontDeskNotes } : {}),
    ...(notes ? { client: { ...existing.client, notes } } : {}),
    ...(status === 'confirmed' ? { 
      acceptedAt: nowIso, 
      acceptedBy: acceptedBy || 'Front Desk Attendant',
      emailSent: true,
      emailSentAt: nowIso
    } : {}),
    ...(status === 'declined' ? { 
      declinedAt: nowIso, 
      declinedBy: declinedBy || 'Front Desk Attendant',
      declineReason: declineReason || 'Time slot capacity reached' 
    } : {}),
    ...(status === 'in-service' ? { checkedInAt: nowIso } : {}),
    ...(status === 'completed' ? { completedAt: nowIso } : {})
  };

  appointments[aptIndex] = updated;

  // Notification: ACCEPTED (incoming booking approved by front desk)
  if (status === 'confirmed' && existing.status === 'pending') {
    const emailHtml = generateBookingConfirmationHtml(updated);
    emailLogs.unshift({
      id: `email-${Date.now()}`,
      appointmentId: updated.id,
      confirmationCode: updated.confirmationCode,
      recipientEmail: updated.client.email,
      recipientName: updated.client.fullName,
      subject: `Nuat Thai Booking Approved: ${updated.serviceName} (${updated.confirmationCode})`,
      sentAt: nowIso,
      type: 'booking_confirmation',
      status: 'delivered',
      htmlBody: emailHtml
    });

    if (notificationSettings.smsEnabled && updated.client.phone) {
      smsLogs.unshift({
        id: `sms-${Date.now()}`,
        appointmentId: updated.id,
        confirmationCode: updated.confirmationCode,
        recipientPhone: updated.client.phone,
        recipientName: updated.client.fullName,
        message: `Nuat Thai: Great news! Your reservation for ${updated.serviceName} on ${updated.date} at ${updated.startTime} is APPROVED. Suite ${updated.roomNumber} with ${updated.therapistName}. Ref: ${updated.confirmationCode}.`,
        sentAt: nowIso,
        type: 'booking_confirmation',
        status: 'delivered'
      });
      updated.smsSent = true;
      updated.smsSentAt = nowIso;
    }
  }

  // Notification: DECLINED
  if (status === 'declined' && existing.status === 'pending') {
    const reasonText = declineReason || 'Requested therapist or time slot capacity reached';
    emailLogs.unshift({
      id: `email-${Date.now()}`,
      appointmentId: updated.id,
      confirmationCode: updated.confirmationCode,
      recipientEmail: updated.client.email,
      recipientName: updated.client.fullName,
      subject: `Nuat Thai Booking Request Update: ${updated.confirmationCode}`,
      sentAt: nowIso,
      type: 'booking_declined',
      status: 'delivered',
      htmlBody: `<div style="font-family: sans-serif; padding: 20px; color: #1e1045;">
        <h2>Nuat Thai Foot & Body Massage</h2>
        <p>Dear <strong>${updated.client.fullName}</strong>,</p>
        <p>Thank you for choosing Nuat Thai. Unfortunately, our Front Desk Attendant could not confirm your booking request for <strong>${updated.serviceName}</strong> on <strong>${updated.date} at ${updated.startTime}</strong>.</p>
        <div style="background: #fdf2f8; border-left: 4px solid #db2777; padding: 12px; margin: 15px 0;">
          <strong>Reason for non-confirmation:</strong> ${reasonText}
        </div>
        <p>If you paid online via GCash/Card, your payment authorization will not be charged or will be automatically refunded.</p>
        <p>Please call our front desk or visit our online booking panel to pick another convenient slot.</p>
      </div>`
    });

    if (notificationSettings.smsEnabled && updated.client.phone) {
      smsLogs.unshift({
        id: `sms-${Date.now()}`,
        appointmentId: updated.id,
        confirmationCode: updated.confirmationCode,
        recipientPhone: updated.client.phone,
        recipientName: updated.client.fullName,
        message: `Nuat Thai Notice: We regret that your booking request (${updated.confirmationCode}) on ${updated.date} at ${updated.startTime} could not be confirmed: "${reasonText}". Please contact us to select an alternative slot.`,
        sentAt: nowIso,
        type: 'booking_declined',
        status: 'delivered'
      });
    }
  }

  // If rescheduled or cancelled, trigger notification
  if (status === 'cancelled' || (date && date !== existing.date) || (startTime && startTime !== existing.startTime)) {
    const isRescheduled = (date && date !== existing.date) || (startTime && startTime !== existing.startTime);
    const subject = isRescheduled 
      ? `Appointment Rescheduled: ${updated.serviceName} (${updated.confirmationCode})`
      : `Appointment Cancelled: ${updated.serviceName} (${updated.confirmationCode})`;

    const emailHtml = generateBookingConfirmationHtml(updated);
    emailLogs.unshift({
      id: `email-${Date.now()}`,
      appointmentId: updated.id,
      confirmationCode: updated.confirmationCode,
      recipientEmail: updated.client.email,
      recipientName: updated.client.fullName,
      subject,
      sentAt: nowIso,
      type: isRescheduled ? 'rescheduled' : 'cancelled',
      status: 'delivered',
      htmlBody: emailHtml
    });

    if (notificationSettings.smsEnabled && updated.client.phone) {
      const smsText = isRescheduled
        ? `Nuat Thai Alert: Your appointment (${updated.confirmationCode}) has been rescheduled to ${updated.date} at ${updated.startTime}. Room ${updated.roomNumber}. See you!`
        : `Nuat Thai Alert: Your appointment (${updated.confirmationCode}) has been cancelled as requested.`;
      smsLogs.unshift({
        id: `sms-${Date.now()}`,
        appointmentId: updated.id,
        confirmationCode: updated.confirmationCode,
        recipientPhone: updated.client.phone,
        recipientName: updated.client.fullName,
        message: smsText,
        sentAt: nowIso,
        type: isRescheduled ? 'rescheduled' : 'cancellation',
        status: 'delivered'
      });
    }
  }

  res.json(updated);
});

// Front Desk Telemetry & Real-Time Stats
app.get('/api/frontdesk/stats', (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const confirmedToday = todayAppointments.filter(a => a.status === 'confirmed').length;
  const inServiceNow = todayAppointments.filter(a => a.status === 'in-service').length;
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const declinedCount = appointments.filter(a => a.status === 'declined').length;

  res.json({
    totalAll: appointments.length,
    todayTotal: todayAppointments.length,
    pendingIncoming: pendingCount,
    confirmedToday,
    inServiceNow,
    completedToday,
    declinedCount,
    lastSync: new Date().toISOString()
  });
});

// ==========================================
// 3. STAFF & THERAPIST SCHEDULING API
// ==========================================
app.get('/api/therapists', (req, res) => {
  res.json(therapists);
});

app.patch('/api/therapists/:id', (req, res) => {
  const { id } = req.params;
  const idx = therapists.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Therapist not found' });
  }
  therapists[idx] = { ...therapists[idx], ...req.body };
  res.json(therapists[idx]);
});

app.get('/api/schedule/overrides', (req, res) => {
  res.json(shiftOverrides);
});

app.post('/api/schedule/overrides', (req, res) => {
  const { therapistId, date, isOff, shiftStart, shiftEnd, breakStart, breakEnd, reason } = req.body;
  const newOverride: ShiftOverride = {
    id: `override-${Date.now()}`,
    therapistId,
    date,
    isOff: Boolean(isOff),
    shiftStart,
    shiftEnd,
    breakStart,
    breakEnd,
    reason
  };
  shiftOverrides.push(newOverride);
  res.status(201).json(newOverride);
});

// ==========================================
// 3.1. BRANCHES MANAGEMENT API (ADMIN)
// ==========================================
app.get('/api/branches', (req, res) => {
  res.json(branches);
});

app.post('/api/branches', (req, res) => {
  const { name, address, phone, city, openingHours, podCount } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Branch name is required' });
  }
  if (!address || typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'Branch address is required' });
  }

  // Generate safe unique ID
  const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `branch-${Date.now()}`;
  let finalId = idSlug;
  let counter = 1;
  while (branches.some(b => b.id === finalId)) {
    finalId = `${idSlug}-${counter++}`;
  }

  const newBranch: Branch = {
    id: finalId,
    name: name.trim(),
    address: address.trim(),
    phone: phone && typeof phone === 'string' && phone.trim() ? phone.trim() : '+63 (02) 8800-0000',
    city: city && typeof city === 'string' && city.trim() ? city.trim() : 'Metro Manila',
    openingHours: openingHours && typeof openingHours === 'string' && openingHours.trim() ? openingHours.trim() : '10:00 AM - 11:00 PM Daily',
    podCount: Number(podCount) > 0 ? Number(podCount) : 10,
    isActive: true
  };

  branches.push(newBranch);
  res.status(201).json(newBranch);
});

app.put('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const idx = branches.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const { name, address, phone, city, openingHours, podCount, isActive } = req.body;
  branches[idx] = {
    ...branches[idx],
    ...(name && typeof name === 'string' ? { name: name.trim() } : {}),
    ...(address && typeof address === 'string' ? { address: address.trim() } : {}),
    ...(phone && typeof phone === 'string' ? { phone: phone.trim() } : {}),
    ...(city && typeof city === 'string' ? { city: city.trim() } : {}),
    ...(openingHours && typeof openingHours === 'string' ? { openingHours: openingHours.trim() } : {}),
    ...(podCount !== undefined ? { podCount: Math.max(1, Number(podCount)) } : {}),
    ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
  };

  res.json(branches[idx]);
});

app.delete('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const idx = branches.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  // Safety safeguard: do not allow deleting the only remaining branch
  if (branches.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining branch. At least one branch must remain active.' });
  }

  const removed = branches.splice(idx, 1)[0];
  res.json({ success: true, message: `Branch "${removed.name}" removed successfully`, deletedId: id });
});

// ==========================================
// 3.2. MASSAGE SERVICES MANAGEMENT API (ADMIN)
// ==========================================
app.get('/api/services', (req, res) => {
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { 
    name, 
    category, 
    tagline, 
    description, 
    durations, 
    recommendedAddons, 
    pressureLevels, 
    image, 
    popular 
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Service name is required' });
  }
  if (!durations || !Array.isArray(durations) || durations.length === 0) {
    return res.status(400).json({ error: 'At least one duration and price tier is required' });
  }

  const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `service-${Date.now()}`;
  let finalId = idSlug;
  let counter = 1;
  while (services.some(s => s.id === finalId)) {
    finalId = `${idSlug}-${counter++}`;
  }

  const formattedDurations = durations
    .map(d => ({
      durationMinutes: Number(d.durationMinutes) || 60,
      price: Number(d.price) || 500
    }))
    .filter(d => d.durationMinutes > 0 && d.price >= 0);

  if (formattedDurations.length === 0) {
    return res.status(400).json({ error: 'Valid duration options (minutes and price) are required' });
  }

  const newService: MassageService = {
    id: finalId,
    name: name.trim(),
    category: category || 'thai-traditional',
    tagline: tagline && typeof tagline === 'string' && tagline.trim() 
      ? tagline.trim() 
      : 'Authentic Nuat Thai therapeutic bodywork',
    description: description && typeof description === 'string' && description.trim() 
      ? description.trim() 
      : 'Experience holistic Thai relaxation and restorative care.',
    durations: formattedDurations,
    recommendedAddons: Array.isArray(recommendedAddons) && recommendedAddons.length > 0 
      ? recommendedAddons 
      : ['plai-balm'],
    pressureLevels: Array.isArray(pressureLevels) && pressureLevels.length > 0 
      ? pressureLevels 
      : ['Medium / Balanced', 'Firm'],
    image: image && typeof image === 'string' && image.trim() 
      ? image.trim() 
      : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    popular: Boolean(popular)
  };

  services.push(newService);
  res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const idx = services.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const { 
    name, 
    category, 
    tagline, 
    description, 
    durations, 
    recommendedAddons, 
    pressureLevels, 
    image, 
    popular 
  } = req.body;

  let formattedDurations = services[idx].durations;
  if (Array.isArray(durations) && durations.length > 0) {
    formattedDurations = durations
      .map(d => ({
        durationMinutes: Number(d.durationMinutes) || 60,
        price: Number(d.price) || 500
      }))
      .filter(d => d.durationMinutes > 0 && d.price >= 0);
  }

  services[idx] = {
    ...services[idx],
    ...(name && typeof name === 'string' ? { name: name.trim() } : {}),
    ...(category ? { category } : {}),
    ...(tagline !== undefined && typeof tagline === 'string' ? { tagline: tagline.trim() } : {}),
    ...(description !== undefined && typeof description === 'string' ? { description: description.trim() } : {}),
    durations: formattedDurations,
    ...(Array.isArray(recommendedAddons) ? { recommendedAddons } : {}),
    ...(Array.isArray(pressureLevels) && pressureLevels.length > 0 ? { pressureLevels } : {}),
    ...(image && typeof image === 'string' ? { image: image.trim() } : {}),
    ...(popular !== undefined ? { popular: Boolean(popular) } : {})
  };

  res.json(services[idx]);
});

app.delete('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const idx = services.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }

  if (services.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining service. At least one service is required.' });
  }

  const removed = services.splice(idx, 1)[0];
  res.json({ success: true, message: `Service "${removed.name}" removed successfully`, deletedId: id });
});

// ==========================================
// 4. AUTOMATED EMAIL LOGS & DISPATCH API
// ==========================================
app.get('/api/emails', (req, res) => {
  const { email, code } = req.query;
  let result = [...emailLogs];
  if (email) {
    result = result.filter(e => e.recipientEmail.toLowerCase() === (email as string).toLowerCase());
  }
  if (code) {
    result = result.filter(e => e.confirmationCode.toLowerCase() === (code as string).toLowerCase());
  }
  res.json(result);
});

app.post('/api/emails/resend', (req, res) => {
  const { appointmentId, recipientEmail } = req.body;
  const apt = appointments.find(a => a.id === appointmentId || a.confirmationCode === appointmentId);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const emailHtml = generateBookingConfirmationHtml(apt);
  const targetEmail = recipientEmail || apt.client.email;

  const resendLog: EmailLog = {
    id: `email-${Date.now()}`,
    appointmentId: apt.id,
    confirmationCode: apt.confirmationCode,
    recipientEmail: targetEmail,
    recipientName: apt.client.fullName,
    subject: `[Resent] Confirmation: ${apt.serviceName} (${apt.confirmationCode})`,
    sentAt: new Date().toISOString(),
    type: 'booking_confirmation',
    status: 'delivered',
    htmlBody: emailHtml
  };
  emailLogs.unshift(resendLog);

  res.json({ success: true, log: resendLog });
});

app.post('/api/emails/resend/:id', (req, res) => {
  const { id } = req.params;
  const existingLog = emailLogs.find(e => e.id === id);
  if (!existingLog) {
    return res.status(404).json({ error: 'Email log not found' });
  }

  const resendLog: EmailLog = {
    ...existingLog,
    id: `email-${Date.now()}`,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    subject: existingLog.subject.startsWith('[Resent]') ? existingLog.subject : `[Resent] ${existingLog.subject}`
  };
  emailLogs.unshift(resendLog);
  res.json({ success: true, log: resendLog });
});

// ==========================================
// 4B. NOTIFICATIONS SETTINGS & SMS GATEWAY API
// ==========================================
app.get('/api/notifications/settings', (req, res) => {
  res.json(notificationSettings);
});

app.patch('/api/notifications/settings', (req, res) => {
  notificationSettings = {
    ...notificationSettings,
    ...req.body
  };
  res.json(notificationSettings);
});

app.get('/api/sms', (req, res) => {
  const { phone, code } = req.query;
  let result = [...smsLogs];
  if (phone) {
    result = result.filter(s => s.recipientPhone.includes(phone as string));
  }
  if (code) {
    result = result.filter(s => s.confirmationCode?.toLowerCase() === (code as string).toLowerCase());
  }
  res.json(result);
});

app.post('/api/sms/test', (req, res) => {
  const { phone, name, type, message } = req.body;
  const targetPhone = phone || '+1 (555) 987-6543';
  const targetName = name || 'Valued Guest';
  const textBody = message || `Zenith Spa: Hi ${targetName}, this is a test SMS appointment reminder. Your upcoming therapy session is confirmed! Reply C to confirm or call to reschedule.`;

  const newLog: SmsLog = {
    id: `sms-${Date.now()}`,
    recipientPhone: targetPhone,
    recipientName: targetName,
    message: textBody,
    sentAt: new Date().toISOString(),
    type: type || 'test',
    status: 'delivered'
  };
  smsLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// ==========================================
// 5. REVENUE & PERFORMANCE ANALYTICS API
// ==========================================
app.get('/api/analytics', (req, res) => {
  // Aggregate revenue from appointments
  const totalRevenue = appointments
    .filter(a => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.pricing.amountPaid, 0);

  const totalBookings = appointments.filter(a => a.status !== 'cancelled').length;
  const avgTicket = totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0;
  const depositCollected = appointments.reduce((sum, a) => sum + a.pricing.amountPaid, 0);
  const remainingBalanceDue = appointments
    .filter(a => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.pricing.balanceDue, 0);

  // Revenue by service
  const serviceMap: { [name: string]: { revenue: number; count: number } } = {};
  appointments.forEach(a => {
    if (a.status === 'cancelled') return;
    if (!serviceMap[a.serviceName]) {
      serviceMap[a.serviceName] = { revenue: 0, count: 0 };
    }
    serviceMap[a.serviceName].revenue += a.pricing.total;
    serviceMap[a.serviceName].count += 1;
  });

  const totalCalculated = Object.values(serviceMap).reduce((s, v) => s + v.revenue, 0) || 1;
  const revenueByService = Object.entries(serviceMap).map(([serviceName, stat]) => ({
    serviceName,
    revenue: stat.revenue,
    percentage: Math.round((stat.revenue / totalCalculated) * 100),
    bookingsCount: stat.count
  })).sort((a, b) => b.revenue - a.revenue);

  // Therapist performance stats
  const therapistPerformance: TherapistPerformanceStat[] = therapists.map(t => {
    const tAppointments = appointments.filter(a => a.therapistId === t.id && a.status !== 'cancelled');
    const tCompleted = appointments.filter(a => a.therapistId === t.id && a.status === 'completed');
    const tRevenue = tAppointments.reduce((sum, a) => sum + a.pricing.total, 0);
    const tTips = tAppointments.reduce((sum, a) => sum + a.pricing.tip, 0);

    // Approximate utilization rate: 30 hours available weekly, percentage booked
    const scheduledHours = 32;
    const bookedHours = tAppointments.reduce((sum, a) => sum + (a.durationMinutes / 60), 0);
    const utilizationRate = Math.min(96, Math.round((bookedHours / scheduledHours) * 100 * 10) / 10 + 45);

    return {
      therapistId: t.id,
      name: t.name,
      avatar: t.avatar,
      title: t.title,
      completedBookings: tCompleted.length || tAppointments.length,
      totalRevenue: tRevenue,
      totalTips: tTips,
      utilizationRate,
      averageRating: t.rating,
      reviewCount: t.reviewCount + tCompleted.length
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const analytics: AnalyticsSummary = {
    currentMonthRevenue: 34850 + totalRevenue,
    previousMonthRevenue: 31900,
    revenueGrowthPct: 9.25,
    totalBookings: 221 + totalBookings,
    averageTicketValue: avgTicket || 185.50,
    depositCollected,
    remainingBalanceDue,
    monthlyTrend: MOCK_MONTHLY_TREND,
    revenueByService,
    therapistPerformance
  };

  res.json(analytics);
});

// ==========================================
// 5B. NUAT THAI LOYALTY CARDS & EDIT AUDIT TRAILS API
// ==========================================

// Get all loyalty cards with search and filters
app.get('/api/loyalty-cards', (req, res) => {
  const { q, tier, status, branch } = req.query;
  let results = [...loyaltyCards];

  if (q && typeof q === 'string') {
    const query = q.trim().toLowerCase();
    results = results.filter(c => 
      c.cardNumber.toLowerCase().includes(query) ||
      c.customerName.toLowerCase().includes(query) ||
      c.customerPhone.toLowerCase().includes(query) ||
      c.customerEmail.toLowerCase().includes(query)
    );
  }

  if (tier && typeof tier === 'string') {
    results = results.filter(c => c.tier.toLowerCase() === tier.toLowerCase());
  }

  if (status && typeof status === 'string') {
    results = results.filter(c => c.status.toLowerCase() === status.toLowerCase());
  }

  if (branch && typeof branch === 'string') {
    results = results.filter(c => c.homeBranch.toLowerCase() === branch.toLowerCase());
  }

  res.json(results);
});

// Quick lookup by customer phone, email, or card number
app.get('/api/loyalty-cards/lookup', (req, res) => {
  const query = (req.query.query as string || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const found = loyaltyCards.find(c => 
    c.cardNumber.toLowerCase() === query ||
    c.customerPhone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
    c.customerEmail.toLowerCase() === query ||
    c.customerName.toLowerCase().includes(query)
  );

  if (!found) {
    return res.status(404).json({ error: 'No loyalty card found matching your query' });
  }

  res.json(found);
});

// Get a single loyalty card with full audit trail
app.get('/api/loyalty-cards/:id', (req, res) => {
  const { id } = req.params;
  const card = loyaltyCards.find(c => c.id === id || c.cardNumber.toLowerCase() === id.toLowerCase());
  if (!card) {
    return res.status(404).json({ error: 'Loyalty card not found' });
  }
  res.json(card);
});

// Create / Issue a new loyalty card
app.post('/api/loyalty-cards', (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail = '',
    tier = 'Classic',
    stamps = 0,
    points = 0,
    homeBranch = 'bgc',
    notes = '',
    adminName = 'Branch Front Desk',
    adminRole = 'Front Desk Officer',
    branch = 'Nuat Thai BGC High Street',
    reason = 'Initial card issuance and customer enrollment.'
  } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Customer name and phone number are required' });
  }

  // Check if phone already has an active card
  const existing = loyaltyCards.find(c => 
    c.customerPhone.replace(/[^0-9]/g, '') === customerPhone.replace(/[^0-9]/g, '')
  );
  if (existing) {
    return res.status(409).json({ 
      error: `A loyalty card already exists for ${customerPhone} (Card #: ${existing.cardNumber})`,
      card: existing
    });
  }

  const cardId = `lc-${Date.now()}`;
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const cardNumber = `NT-SUKI-${randomDigits}`;
  const now = new Date().toISOString();
  
  // Expiry is 1 year from now
  const expDate = new Date();
  expDate.setFullYear(expDate.getFullYear() + 1);

  const initialAudit: LoyaltyAuditTrail = {
    id: `aud-${Date.now()}-init`,
    cardId,
    cardNumber,
    customerName,
    timestamp: now,
    adminName,
    adminRole,
    action: 'CARD_CREATED',
    fieldChanged: 'Card Registration',
    previousValue: 'None',
    newValue: `Active (${tier}, ${stamps} stamps, ${points} pts)`,
    reason,
    branch
  };

  const newCard: LoyaltyCard = {
    id: cardId,
    cardNumber,
    customerName,
    customerPhone,
    customerEmail,
    tier: (tier as LoyaltyTier) || 'Classic',
    stamps: Number(stamps) || 0,
    stampsTarget: 10,
    points: Number(points) || 0,
    totalVisits: Number(stamps) > 0 ? 1 : 0,
    lifetimeSpend: 0,
    rewards: [],
    status: 'active',
    homeBranch,
    issuedAt: now,
    expiresAt: expDate.toISOString(),
    notes,
    auditTrail: [initialAudit]
  };

  loyaltyCards.unshift(newCard);
  res.status(201).json(newCard);
});

// Edit loyalty card with MANDATORY audit trail tracking
app.put('/api/loyalty-cards/:id', (req, res) => {
  const { id } = req.params;
  const cardIndex = loyaltyCards.findIndex(c => c.id === id || c.cardNumber.toLowerCase() === id.toLowerCase());
  
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Loyalty card not found' });
  }

  const current = loyaltyCards[cardIndex];
  const {
    customerName,
    customerPhone,
    customerEmail,
    tier,
    stamps,
    points,
    status,
    expiresAt,
    notes,
    homeBranch,
    adminName = 'Branch Administrator',
    adminRole = 'Branch Supervisor',
    branch = 'Nuat Thai BGC High Street',
    reason
  } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'An admin explanation/reason is strictly required for the audit trail' });
  }

  const now = new Date().toISOString();
  const newAuditEntries: LoyaltyAuditTrail[] = [];

  // Track stamps change
  if (stamps !== undefined && Number(stamps) !== current.stamps) {
    const newStamps = Number(stamps);
    const action: LoyaltyAuditAction = newStamps > current.stamps ? 'STAMPS_ADDED' : 'STAMPS_DEDUCTED';
    newAuditEntries.push({
      id: `aud-${Date.now()}-stamps`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action,
      fieldChanged: 'Stamps Count',
      previousValue: `${current.stamps} / ${current.stampsTarget} stamps`,
      newValue: `${newStamps} / ${current.stampsTarget} stamps`,
      reason: reason.trim(),
      branch
    });
  }

  // Track tier change
  if (tier !== undefined && tier !== current.tier) {
    newAuditEntries.push({
      id: `aud-${Date.now()}-tier`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action: 'TIER_UPGRADED',
      fieldChanged: 'Membership Tier',
      previousValue: current.tier,
      newValue: tier,
      reason: reason.trim(),
      branch
    });
  }

  // Track points change
  if (points !== undefined && Number(points) !== current.points) {
    newAuditEntries.push({
      id: `aud-${Date.now()}-pts`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action: 'POINTS_ADJUSTED',
      fieldChanged: 'Points Balance',
      previousValue: `${current.points} pts`,
      newValue: `${Number(points)} pts`,
      reason: reason.trim(),
      branch
    });
  }

  // Track status change
  if (status !== undefined && status !== current.status) {
    newAuditEntries.push({
      id: `aud-${Date.now()}-status`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action: 'STATUS_CHANGED',
      fieldChanged: 'Card Status',
      previousValue: current.status,
      newValue: status,
      reason: reason.trim(),
      branch
    });
  }

  // Track profile/contact info edit
  if (
    (customerName && customerName !== current.customerName) ||
    (customerPhone && customerPhone !== current.customerPhone) ||
    (customerEmail !== undefined && customerEmail !== current.customerEmail) ||
    (homeBranch && homeBranch !== current.homeBranch)
  ) {
    newAuditEntries.push({
      id: `aud-${Date.now()}-prof`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action: 'PROFILE_EDITED',
      fieldChanged: 'Customer Profile Info',
      previousValue: `${current.customerName} (${current.customerPhone})`,
      newValue: `${customerName || current.customerName} (${customerPhone || current.customerPhone})`,
      reason: reason.trim(),
      branch
    });
  }

  // Fallback if other fields changed (e.g. notes, expiry)
  if (newAuditEntries.length === 0) {
    newAuditEntries.push({
      id: `aud-${Date.now()}-edit`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName,
      adminRole,
      action: 'CARD_EDITED',
      fieldChanged: 'Card Details / Notes',
      previousValue: current.notes || 'No notes',
      newValue: notes || 'Updated notes',
      reason: reason.trim(),
      branch
    });
  }

  // Check if stamps reached or exceeded 10 -> automatically add milestone reward if crossed
  const updatedRewards = [...current.rewards];
  if (stamps !== undefined && Number(stamps) >= 10 && current.stamps < 10) {
    const autoReward: LoyaltyReward = {
      id: `rew-${Date.now()}`,
      name: 'Free 60m Authentic Thai Body Massage',
      description: 'Earned automatically by completing 10 Nuat Thai Suki Stamps.',
      earnedAt: now,
      status: 'available'
    };
    updatedRewards.unshift(autoReward);

    newAuditEntries.unshift({
      id: `aud-${Date.now()}-rew`,
      cardId: current.id,
      cardNumber: current.cardNumber,
      customerName: customerName || current.customerName,
      timestamp: now,
      adminName: 'System / Milestone Auto-Award',
      adminRole: 'Automated Loyalty Engine',
      action: 'REWARD_GRANTED',
      fieldChanged: 'Milestone Reward',
      previousValue: `${current.rewards.filter(r => r.status === 'available').length} available`,
      newValue: 'Free 60m Thai Body Massage Granted!',
      reason: 'Achieved 10/10 Nuat Thai Suki Stamps milestone.',
      branch
    });
  }

  const updatedCard: LoyaltyCard = {
    ...current,
    customerName: customerName !== undefined ? customerName : current.customerName,
    customerPhone: customerPhone !== undefined ? customerPhone : current.customerPhone,
    customerEmail: customerEmail !== undefined ? customerEmail : current.customerEmail,
    tier: tier !== undefined ? (tier as LoyaltyTier) : current.tier,
    stamps: stamps !== undefined ? Number(stamps) : current.stamps,
    points: points !== undefined ? Number(points) : current.points,
    status: status !== undefined ? status : current.status,
    expiresAt: expiresAt !== undefined ? expiresAt : current.expiresAt,
    notes: notes !== undefined ? notes : current.notes,
    homeBranch: homeBranch !== undefined ? homeBranch : current.homeBranch,
    rewards: updatedRewards,
    auditTrail: [...newAuditEntries, ...current.auditTrail]
  };

  loyaltyCards[cardIndex] = updatedCard;
  res.json(updatedCard);
});

// Quick action: Add or deduct stamps
app.post('/api/loyalty-cards/:id/quick-stamp', (req, res) => {
  const { id } = req.params;
  const { delta = 1, adminName = 'Branch Front Desk', adminRole = 'Front Desk Officer', branch = 'Nuat Thai BGC', reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason for stamp adjustment is strictly required' });
  }

  const cardIndex = loyaltyCards.findIndex(c => c.id === id || c.cardNumber.toLowerCase() === id.toLowerCase());
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Loyalty card not found' });
  }

  const card = loyaltyCards[cardIndex];
  const oldStamps = card.stamps;
  const numDelta = Number(delta);
  let newStamps = Math.max(0, oldStamps + numDelta);

  const now = new Date().toISOString();
  const auditEntries: LoyaltyAuditTrail[] = [];

  const action: LoyaltyAuditAction = numDelta > 0 ? 'STAMPS_ADDED' : 'STAMPS_DEDUCTED';
  auditEntries.push({
    id: `aud-${Date.now()}-quickstamp`,
    cardId: card.id,
    cardNumber: card.cardNumber,
    customerName: card.customerName,
    timestamp: now,
    adminName,
    adminRole,
    action,
    fieldChanged: 'Stamps Count',
    previousValue: `${oldStamps} stamps`,
    newValue: `${newStamps} stamps`,
    reason: reason.trim(),
    branch
  });

  const updatedRewards = [...card.rewards];
  // Auto grant free massage if hitting 10 stamps
  if (newStamps >= 10 && oldStamps < 10) {
    updatedRewards.unshift({
      id: `rew-${Date.now()}`,
      name: 'Free 60m Authentic Thai Body Massage',
      description: 'Earned by completing 10 Nuat Thai Suki Stamps.',
      earnedAt: now,
      status: 'available'
    });

    auditEntries.unshift({
      id: `aud-${Date.now()}-rew-granted`,
      cardId: card.id,
      cardNumber: card.cardNumber,
      customerName: card.customerName,
      timestamp: now,
      adminName: 'Loyalty Rewards Engine',
      adminRole: 'Automated Milestone',
      action: 'REWARD_GRANTED',
      fieldChanged: 'Reward Voucher',
      previousValue: 'None',
      newValue: 'Free 60m Authentic Thai Body Massage',
      reason: 'Earned upon completing 10th Suki stamp cycle.',
      branch
    });
  }

  const updatedCard: LoyaltyCard = {
    ...card,
    stamps: newStamps,
    totalVisits: numDelta > 0 ? card.totalVisits + 1 : card.totalVisits,
    rewards: updatedRewards,
    auditTrail: [...auditEntries, ...card.auditTrail]
  };

  loyaltyCards[cardIndex] = updatedCard;
  res.json(updatedCard);
});

// Grant a reward to customer card
app.post('/api/loyalty-cards/:id/rewards/grant', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description = '', 
    adminName = 'Branch Supervisor', 
    adminRole = 'Supervisor', 
    branch = 'Nuat Thai BGC', 
    reason 
  } = req.body;

  if (!name || !reason) {
    return res.status(400).json({ error: 'Reward name and justification reason are required' });
  }

  const cardIndex = loyaltyCards.findIndex(c => c.id === id || c.cardNumber.toLowerCase() === id.toLowerCase());
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Loyalty card not found' });
  }

  const card = loyaltyCards[cardIndex];
  const now = new Date().toISOString();

  const newReward: LoyaltyReward = {
    id: `rew-${Date.now()}`,
    name,
    description,
    earnedAt: now,
    status: 'available'
  };

  const auditEntry: LoyaltyAuditTrail = {
    id: `aud-${Date.now()}-grant`,
    cardId: card.id,
    cardNumber: card.cardNumber,
    customerName: card.customerName,
    timestamp: now,
    adminName,
    adminRole,
    action: 'REWARD_GRANTED',
    fieldChanged: 'Reward Granted',
    previousValue: `${card.rewards.filter(r => r.status === 'available').length} available`,
    newValue: `${name} (Available)`,
    reason: reason.trim(),
    branch
  };

  const updatedCard: LoyaltyCard = {
    ...card,
    rewards: [newReward, ...card.rewards],
    auditTrail: [auditEntry, ...card.auditTrail]
  };

  loyaltyCards[cardIndex] = updatedCard;
  res.json(updatedCard);
});

// Redeem a reward
app.post('/api/loyalty-cards/:id/rewards/:rewardId/redeem', (req, res) => {
  const { id, rewardId } = req.params;
  const { adminName = 'Front Desk', adminRole = 'Front Desk Officer', branch = 'Nuat Thai BGC', reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Admin reason for redemption is strictly required' });
  }

  const cardIndex = loyaltyCards.findIndex(c => c.id === id || c.cardNumber.toLowerCase() === id.toLowerCase());
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Loyalty card not found' });
  }

  const card = loyaltyCards[cardIndex];
  const rewardIndex = card.rewards.findIndex(r => r.id === rewardId);
  if (rewardIndex === -1) {
    return res.status(404).json({ error: 'Reward not found on this card' });
  }

  if (card.rewards[rewardIndex].status !== 'available') {
    return res.status(400).json({ error: 'This reward has already been redeemed or expired' });
  }

  const now = new Date().toISOString();
  const reward = card.rewards[rewardIndex];

  const updatedReward: LoyaltyReward = {
    ...reward,
    status: 'redeemed',
    redeemedAt: now,
    redeemedByAdmin: `${adminName} (${adminRole})`
  };

  const updatedRewards = [...card.rewards];
  updatedRewards[rewardIndex] = updatedReward;

  const auditEntry: LoyaltyAuditTrail = {
    id: `aud-${Date.now()}-redeem`,
    cardId: card.id,
    cardNumber: card.cardNumber,
    customerName: card.customerName,
    timestamp: now,
    adminName,
    adminRole,
    action: 'REWARD_REDEEMED',
    fieldChanged: 'Reward Redemption',
    previousValue: `Available (${reward.name})`,
    newValue: `Redeemed by ${adminName}`,
    reason: reason.trim(),
    branch
  };

  const updatedCard: LoyaltyCard = {
    ...card,
    rewards: updatedRewards,
    auditTrail: [auditEntry, ...card.auditTrail]
  };

  loyaltyCards[cardIndex] = updatedCard;
  res.json(updatedCard);
});

// Master Audit Trails query API across all cards
app.get('/api/loyalty-audit-trails', (req, res) => {
  const { cardId, action, search } = req.query;
  
  let allTrails: LoyaltyAuditTrail[] = [];
  loyaltyCards.forEach(c => {
    allTrails.push(...c.auditTrail);
  });

  // Sort descending by timestamp
  allTrails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (cardId && typeof cardId === 'string') {
    allTrails = allTrails.filter(t => t.cardId === cardId || t.cardNumber.toLowerCase() === cardId.toLowerCase());
  }

  if (action && typeof action === 'string') {
    allTrails = allTrails.filter(t => t.action === action);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    allTrails = allTrails.filter(t => 
      t.customerName.toLowerCase().includes(q) ||
      t.cardNumber.toLowerCase().includes(q) ||
      t.adminName.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      t.fieldChanged.toLowerCase().includes(q)
    );
  }

  res.json(allTrails);
});

// ==========================================
// 6. GEMINI IMAGE GENERATION & EDITING API
// ==========================================
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Generate image using gemini-3.1-flash-image / gemini-3-pro-image with 1K, 2K, 4K resolution
app.post('/api/gemini/generate-image', async (req, res) => {
  const { prompt, aspectRatio = '1:1', imageSize = '1K', model = 'gemini-3.1-flash-image' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ 
      error: 'GEMINI_API_KEY is not configured in server environment.' 
    });
  }

  try {
    const ai = getAiClient();
    const selectedModel = model === 'gemini-3-pro-image-preview' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize as any // '1K', '2K', or '4K'
        }
      }
    });

    let imageUrl: string | null = null;
    let descriptionText = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        descriptionText += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'No image data returned from model', 
        details: descriptionText 
      });
    }

    res.json({
      success: true,
      imageUrl,
      modelUsed: selectedModel,
      imageSize,
      aspectRatio,
      prompt
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ 
      error: err.message || 'Image generation failed', 
      details: String(err) 
    });
  }
});

// Edit image using gemini-3.1-flash-image / gemini-3.1-flash-lite-image
app.post('/api/gemini/edit-image', async (req, res) => {
  const { prompt, base64Image, mimeType = 'image/png', imageSize = '1K' } = req.body;

  if (!prompt || !base64Image) {
    return res.status(400).json({ error: 'Prompt and base64Image are required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const ai = getAiClient();
    // Clean base64 header if present
    const cleanData = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanData,
              mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          imageSize: imageSize as any
        }
      }
    });

    let imageUrl: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Model did not produce an edited image.' });
    }

    res.json({ success: true, imageUrl, prompt });
  } catch (err: any) {
    console.error('Image edit error:', err);
    res.status(500).json({ error: err.message || 'Failed to edit image' });
  }
});

// ==========================================
// VITE SPA MIDDLEWARE / PRODUCTION SERVING
// ==========================================
async function setupViteAndListen() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spa Massage Booking Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteAndListen();
