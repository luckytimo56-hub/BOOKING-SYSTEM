import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Calendar, Check, X, Plus, AlertCircle, Save, 
  Sparkles, Coffee, Shield, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { Therapist, ShiftOverride } from '../types';

interface StaffSchedulingProps {
  therapists: Therapist[];
  onTherapistUpdated: (updatedList: Therapist[]) => void;
  onSyncTriggered: () => void;
}

const DAYS = [
  { index: 0, label: 'Sun', full: 'Sunday' },
  { index: 1, label: 'Mon', full: 'Monday' },
  { index: 2, label: 'Tue', full: 'Tuesday' },
  { index: 3, label: 'Wed', full: 'Wednesday' },
  { index: 4, label: 'Thu', full: 'Thursday' },
  { index: 5, label: 'Fri', full: 'Friday' },
  { index: 6, label: 'Sat', full: 'Saturday' }
];

export const StaffScheduling: React.FC<StaffSchedulingProps> = ({
  therapists,
  onTherapistUpdated,
  onSyncTriggered
}) => {
  const [localTherapists, setLocalTherapists] = useState<Therapist[]>(therapists);
  const [overrides, setOverrides] = useState<ShiftOverride[]>([]);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Time off modal state
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideTherapistId, setOverrideTherapistId] = useState<string>(therapists[0]?.id || '');
  const [overrideDate, setOverrideDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [overrideIsOff, setOverrideIsOff] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('Personal Day / Continuing Education');

  // Fetch overrides on mount
  useEffect(() => {
    fetch('/api/schedule/overrides')
      .then(res => (res && res.ok ? res.json() : []))
      .then(data => setOverrides(Array.isArray(data) ? data : []))
      .catch(() => setOverrides([]));
  }, []);

  useEffect(() => {
    setLocalTherapists(therapists);
  }, [therapists]);

  // Toggle working day
  const toggleWorkingDay = (therapistId: string, dayIdx: number) => {
    setLocalTherapists(prev => prev.map(t => {
      if (t.id !== therapistId) return t;
      const currentDays = [...t.workingDays];
      const hasDay = currentDays.includes(dayIdx);
      const updatedDays = hasDay 
        ? currentDays.filter(d => d !== dayIdx)
        : [...currentDays, dayIdx].sort();
      return { ...t, workingDays: updatedDays };
    }));
  };

  // Update shift timings
  const updateTherapistField = (therapistId: string, field: keyof Therapist, value: any) => {
    setLocalTherapists(prev => prev.map(t => {
      if (t.id !== therapistId) return t;
      return { ...t, [field]: value };
    }));
  };

  // Save changes to backend
  const handleSaveTherapist = async (therapist: Therapist) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/therapists/${therapist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(therapist)
      });
      if (!res.ok) throw new Error('Failed to update therapist shift schedule');
      const saved = await res.json();
      
      const updatedList = localTherapists.map(t => t.id === saved.id ? saved : t);
      setLocalTherapists(updatedList);
      onTherapistUpdated(updatedList);
      onSyncTriggered();

      setStatusMessage(`Schedule updated for ${therapist.name}. Live booking slots recomputed!`);
      setTimeout(() => setStatusMessage(null), 4000);
      setActiveEditingId(null);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Error updating schedule: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Day Off / Schedule Override
  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/schedule/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId: overrideTherapistId,
          date: overrideDate,
          isOff: overrideIsOff,
          reason: overrideReason
        })
      });
      if (res.ok) {
        const newOv = await res.json();
        setOverrides(prev => [...prev, newOv]);
        setShowOverrideModal(false);
        onSyncTriggered();
        setStatusMessage('Schedule override recorded. Client booking calendar synced.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-sans font-bold text-slate-900">Staff Scheduling &amp; Shift Planner</h1>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              Live Slot Sync
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Configure therapist weekly shifts, lunch breaks, and room allocations. Slot availability synchronizes immediately in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Day Off / Time-Off Override</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Staff Roster Grid */}
      <div className="space-y-4">
        {localTherapists.map((therapist) => {
          const isEditing = activeEditingId === therapist.id;
          const therapistOverrides = overrides.filter(o => o.therapistId === therapist.id);

          return (
            <div
              key={therapist.id}
              className={`bg-white rounded-xl border transition-all p-5 shadow-sm ${
                isEditing ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Profile info */}
                <div className="flex items-start gap-4 min-w-[280px]">
                  <img
                    src={therapist.avatar}
                    alt={therapist.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-sans font-bold text-slate-900">{therapist.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        therapist.isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {therapist.isActive ? 'Active Duty' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{therapist.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {therapist.licenseNumber} • {therapist.roomNumber}
                    </p>

                    {/* Active Overrides Badge */}
                    {therapistOverrides.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>{therapistOverrides.length} upcoming time-off override(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Days Selector */}
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                    Weekly Working Days ({therapist.workingDays.length} days active)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map(day => {
                      const isWorking = therapist.workingDays.includes(day.index);
                      return (
                        <button
                          key={day.index}
                          type="button"
                          onClick={() => toggleWorkingDay(therapist.id, day.index)}
                          className={`w-9 h-9 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                            isWorking
                              ? 'bg-blue-700 text-white shadow-sm font-bold'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={`${day.full}: ${isWorking ? 'Working' : 'Off'}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Hours & Break */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Daily Shift Hours
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={therapist.shiftStart}
                        onChange={(e) => updateTherapistField(therapist.id, 'shiftStart', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
                      />
                      <span className="text-slate-400 font-bold">to</span>
                      <input
                        type="time"
                        value={therapist.shiftEnd}
                        onChange={(e) => updateTherapistField(therapist.id, 'shiftEnd', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pl-4 border-l border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Scheduled Break
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={therapist.breakStart}
                        onChange={(e) => updateTherapistField(therapist.id, 'breakStart', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="time"
                        value={therapist.breakEnd}
                        onChange={(e) => updateTherapistField(therapist.id, 'breakEnd', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Action */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveTherapist(therapist)}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Shifts</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Overrides List */}
      {overrides.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-sans font-bold text-slate-900 mb-3">
            Active Days Off &amp; Special Schedule Exceptions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {overrides.map(ov => {
              const th = therapists.find(t => t.id === ov.therapistId);
              return (
                <div key={ov.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-start font-semibold text-slate-800">
                    <span>{th?.name || 'Therapist'}</span>
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                      {ov.isOff ? 'Off Duty' : 'Custom Hours'}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1 font-mono text-[11px]">{ov.date}</div>
                  <div className="text-slate-600 mt-1 italic text-[11px]">"{ov.reason || 'Requested time off'}"</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Schedule Override */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-sans font-bold text-slate-900">Add Therapist Schedule Override</h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOverride} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Therapist</label>
                <select
                  value={overrideTherapistId}
                  onChange={(e) => setOverrideTherapistId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status on this Date</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={overrideIsOff}
                      onChange={() => setOverrideIsOff(true)}
                    />
                    <span>Off Duty (Full Day Unavailable)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!overrideIsOff}
                      onChange={() => setOverrideIsOff(false)}
                    />
                    <span>Special Hours</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Annual Vacation, Sports Certification Workshop"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
