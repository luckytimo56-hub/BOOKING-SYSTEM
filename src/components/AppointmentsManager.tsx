import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Phone, Mail, Search, Filter, 
  CheckCircle, AlertCircle, XCircle, MoreVertical, Eye, 
  RefreshCw, MapPin, DollarSign 
} from 'lucide-react';
import { Appointment, Therapist, AppointmentStatus } from '../types';
import { generateBookingConfirmationHtml } from '../utils/emailGenerator';

interface AppointmentsManagerProps {
  therapists: Therapist[];
  onAppointmentsChanged: () => void;
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
  therapists,
  onAppointmentsChanged
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');

  // Preview email modal
  const [selectedAppointmentForEmail, setSelectedAppointmentForEmail] = useState<Appointment | null>(null);

  // Reschedule modal
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('14:00');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (therapistFilter !== 'all') params.append('therapistId', therapistFilter);

      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [searchQuery, statusFilter, therapistFilter]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAppointments();
        onAppointmentsChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalApt || !rescheduleDate || !rescheduleTime) return;

    try {
      const res = await fetch(`/api/bookings/${rescheduleModalApt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
          status: 'rescheduled'
        })
      });
      if (res.ok) {
        setRescheduleModalApt(null);
        fetchAppointments();
        onAppointmentsChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">Incoming Pending</span>;
      case 'confirmed':
        return <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Confirmed</span>;
      case 'in-service':
        return <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">In Treatment</span>;
      case 'completed':
        return <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">Completed</span>;
      case 'declined':
        return <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">Declined</span>;
      case 'cancelled':
        return <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">Cancelled</span>;
      case 'rescheduled':
        return <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Rescheduled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-slate-900">Appointments &amp; Live Roster</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time appointment schedule, guest check-ins, status transitions, and client intake preferences.
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, guest name, phone, email..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-service">In-Service</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Specialist:</span>
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">All Practitioners</option>
              {therapists.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-medium">Fetching appointment records...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-sans font-bold text-slate-900">No Appointments Match Current Filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query or status filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            return (
              <div
                key={apt.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Code, Time, Service, Client */}
                <div className="space-y-2 min-w-[320px]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-950 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {apt.confirmationCode}
                    </span>
                    {getStatusBadge(apt.status)}
                    <span className="text-xs text-slate-400 font-medium">• {apt.roomNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-sans font-bold text-slate-900">{apt.serviceName}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.startTime} - {apt.endTime} ({apt.durationMinutes}m)
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-900">{apt.client.fullName}</span>
                    <span>• {apt.client.email}</span>
                    <span>• {apt.client.phone}</span>
                  </div>
                </div>

                {/* Center: Therapist, Intake & Add-ons */}
                <div className="space-y-1.5 text-xs text-slate-600 lg:max-w-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={apt.therapistAvatar}
                      alt={apt.therapistName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="font-semibold text-slate-800">{apt.therapistName}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <strong>Pressure:</strong> {apt.client.pressurePreference}
                  </div>

                  {apt.client.focusAreas.length > 0 && (
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      <strong>Focus:</strong> {apt.client.focusAreas.join(', ')}
                    </div>
                  )}

                  {apt.addons.length > 0 && (
                    <div className="text-[11px] text-blue-700 font-medium">
                      + {apt.addons.map(a => a.name).join(', ')}
                    </div>
                  )}
                </div>

                {/* Right: Payment & Status Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-sm font-sans font-bold text-slate-900">
                      ${apt.pricing.total.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-blue-600 font-semibold">
                      Paid: ${apt.pricing.amountPaid.toFixed(2)} ({apt.payment.cardBrand || 'Card'})
                    </div>
                    {apt.pricing.balanceDue > 0 && (
                      <div className="text-[11px] text-amber-700 font-semibold">
                        Due: ${apt.pricing.balanceDue.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAppointmentForEmail(apt)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Confirmation Email"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'in-service')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleModalApt(apt);
                            setRescheduleDate(apt.date);
                            setRescheduleTime(apt.startTime);
                          }}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </>
                    )}

                    {apt.status === 'in-service' && (
                      <button
                        onClick={() => updateStatus(apt.id, 'completed')}
                        className="px-2.5 py-1 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition cursor-pointer"
                      >
                        Complete Session
                      </button>
                    )}

                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Cancel this appointment?')) {
                            updateStatus(apt.id, 'cancelled');
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-sans font-bold text-slate-900">
              Reschedule Appointment ({rescheduleModalApt.confirmationCode})
            </h3>
            <p className="text-xs text-slate-600">
              Client: {rescheduleModalApt.client.fullName} • {rescheduleModalApt.serviceName}
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Start Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * An automated reschedule notification email will be instantly dispatched to {rescheduleModalApt.client.email}.
              </p>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalApt(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Email Sent Modal */}
      {selectedAppointmentForEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Automated Email Dispatched to {selectedAppointmentForEmail.client.fullName}
                </span>
              </div>
              <button
                onClick={() => setSelectedAppointmentForEmail(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
              <iframe
                title="Email Preview"
                srcDoc={generateBookingConfirmationHtml(selectedAppointmentForEmail)}
                className="w-full h-[480px] rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
