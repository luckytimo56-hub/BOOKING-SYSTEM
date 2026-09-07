import React, { useState } from 'react';
import { 
  CheckCircle2, Calendar, Clock, MapPin, User, Download, ExternalLink, 
  Mail, Printer, AlertTriangle, RefreshCw, XCircle, ArrowRight 
} from 'lucide-react';
import { Appointment } from '../types';
import { generateGoogleCalendarUrl, generateIcsFileContent, generateBookingConfirmationHtml } from '../utils/emailGenerator';

interface BookingConfirmationViewProps {
  appointment: Appointment;
  onBookAnother: () => void;
  onViewEmailCenter: () => void;
  onUpdateStatus?: (updated: Appointment) => void;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  appointment,
  onBookAnother,
  onViewEmailCenter,
  onUpdateStatus
}) => {
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment>(appointment);

  const googleCalUrl = generateGoogleCalendarUrl(currentAppointment);

  const handleDownloadIcs = () => {
    const icsContent = generateIcsFileContent(currentAppointment);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Massage_Booking_${currentAppointment.confirmationCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment? An automated cancellation confirmation email will be sent.')) {
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${currentAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentAppointment(updated);
        if (onUpdateStatus) onUpdateStatus(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const formattedDate = new Date(`${currentAppointment.date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-center text-white relative border-b border-slate-800">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-400" />
          </div>

          <span className="text-[11px] uppercase font-bold tracking-widest text-blue-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 inline-block mb-2">
            {currentAppointment.status === 'cancelled' ? 'Appointment Cancelled' : 'Reservation Confirmed & Secured'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {currentAppointment.status === 'cancelled' 
              ? 'Your Appointment Has Been Cancelled' 
              : 'Your Spa Treatment is Confirmed'}
          </h1>
          
          <p className="text-sm text-slate-300 max-w-lg mx-auto mt-2">
            Thank you, {currentAppointment.client.fullName}. An automated confirmation and preparation protocol have been delivered to <span className="font-semibold text-white underline">{currentAppointment.client.email}</span>.
          </p>

          {/* Reference Code Pill */}
          <div className="mt-6 inline-flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-lg px-6 py-2.5 shadow-inner">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Confirmation Reference</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-blue-400 mt-0.5">
              {currentAppointment.confirmationCode}
            </span>
          </div>
        </div>

        {/* Action Quickbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadIcs}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download .ics Calendar</span>
            </button>

            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Add to Google Calendar</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailPreviewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>View Dispatched Email</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* Appointment & Receipt Body */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Col: Appointment Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Appointment Details
                </h3>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Date &amp; Scheduled Time</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formattedDate}
                      </span>
                      <span className="text-blue-700 font-semibold block mt-0.5">
                        {currentAppointment.startTime} - {currentAppointment.endTime} ({currentAppointment.durationMinutes} minutes)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                    <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentAppointment.therapistAvatar} 
                        alt={currentAppointment.therapistName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                      />
                      <div>
                        <span className="text-slate-500 block">Licensed Specialist</span>
                        <span className="font-bold text-slate-900">{currentAppointment.therapistName}</span>
                        <span className="text-slate-500 block text-[11px]">{currentAppointment.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Sanctuary Location</span>
                      <span className="font-semibold text-slate-800">
                        Serenity Sanctuary Suites, 450 Lotus Blossom Way, Suite 200, San Francisco, CA
                      </span>
                      <span className="text-slate-400 block text-[11px] mt-0.5">Valet &amp; complimentary 2-hour underground parking available.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Intake Preferences</span>
                <div className="flex justify-between text-slate-700">
                  <span>Pressure Preference:</span>
                  <span className="font-bold text-slate-900">{currentAppointment.client.pressurePreference}</span>
                </div>
                {currentAppointment.client.focusAreas.length > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Target Focus Areas:</span>
                    <span className="font-bold text-slate-900 text-right">{currentAppointment.client.focusAreas.join(', ')}</span>
                  </div>
                )}
                {currentAppointment.client.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold block text-slate-700">Notes for Specialist:</span>
                    <p className="mt-0.5 italic">"{currentAppointment.client.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Payment Receipt */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Payment Receipt
                </h3>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{currentAppointment.serviceName}</span>
                    <span className="font-semibold text-slate-900">${currentAppointment.pricing.servicePrice.toFixed(2)}</span>
                  </div>

                  {currentAppointment.addons.map(a => (
                    <div key={a.id} className="flex justify-between text-slate-600">
                      <span>Add-on: {a.name}</span>
                      <span className="font-semibold text-slate-900">+${a.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {currentAppointment.pricing.discount > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>Promotional Discount</span>
                      <span>-${currentAppointment.pricing.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Sales Tax (8%)</span>
                    <span>${currentAppointment.pricing.tax.toFixed(2)}</span>
                  </div>

                  {currentAppointment.pricing.tip > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Therapist Gratuity</span>
                      <span>${currentAppointment.pricing.tip.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                    <span>Total Session Value</span>
                    <span className="text-base font-sans">${currentAppointment.pricing.total.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-1 text-blue-700 font-semibold bg-blue-50/70 p-2.5 rounded-lg">
                    <div className="flex justify-between">
                      <span>Amount Processed Online ({currentAppointment.payment.cardBrand || 'Card'})</span>
                      <span>${currentAppointment.pricing.amountPaid.toFixed(2)}</span>
                    </div>
                    {currentAppointment.pricing.balanceDue > 0 && (
                      <div className="flex justify-between text-amber-800 text-[11px]">
                        <span>Remaining Balance Due at Arrival</span>
                        <span>${currentAppointment.pricing.balanceDue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 space-y-0.5 font-mono">
                    <div>Transaction ID: {currentAppointment.payment.transactionId}</div>
                    <div>Authorization Code: {currentAppointment.payment.authCode}</div>
                    <div>Processed: {new Date(currentAppointment.payment.paidAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Arrival Guidelines */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 text-xs text-slate-950 space-y-1.5">
                <span className="font-bold block text-blue-950">What to Expect on Treatment Day:</span>
                <p>• Please arrive 15 minutes before your time to enjoy warm botanical infusions and relax in our quiet lounge.</p>
                <p>• Robes, slippers, private showers, and organic eucalyptus steam room access are complimentary.</p>
              </div>
            </div>
          </div>

          {/* Cancellation or Next Action Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              {currentAppointment.status !== 'cancelled' ? (
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleCancelAppointment}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Appointment</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-red-700">This appointment is marked cancelled.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onViewEmailCenter}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Go to Email Logs</span>
              </button>

              <button
                type="button"
                onClick={onBookAnother}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-600 transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <span>Book Another Treatment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Automated Email Dispatched */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Automated Email Confirmation Sent to Client</span>
              </div>
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs text-slate-600 flex justify-between">
              <div>
                <strong>To:</strong> {currentAppointment.client.email} | <strong>Subject:</strong> Booking Confirmed: {currentAppointment.serviceName} ({currentAppointment.confirmationCode})
              </div>
              <span className="text-blue-600 font-semibold">✓ Delivered</span>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
              <iframe
                title="Email Preview"
                srcDoc={generateBookingConfirmationHtml(currentAppointment)}
                className="w-full h-[520px] rounded-xl border border-slate-300 bg-white shadow-inner"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
