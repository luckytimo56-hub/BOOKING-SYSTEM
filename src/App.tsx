import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { BookingFlow } from './components/BookingFlow';
import { StaffScheduling } from './components/StaffScheduling';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AppointmentsManager } from './components/AppointmentsManager';
import { AutomatedEmailCenter } from './components/AutomatedEmailCenter';
import { AmbianceStudio } from './components/AmbianceStudio';
import { BookingConfirmationView } from './components/BookingConfirmationView';
import { CustomerBookingPanel } from './components/CustomerBookingPanel';
import { LoyaltyCardsManager } from './components/LoyaltyCardsManager';
import { FrontDeskPanel } from './components/FrontDeskPanel';
import { AdminPanel } from './components/AdminPanel';
import { Therapist, Appointment, Branch, MassageService } from './types';
import { NUAT_THAI_BRANCHES, MASSAGE_SERVICES, THERAPISTS } from './data/initialData';
import { Search, X, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('frontdesk');
  const [therapists, setTherapists] = useState<Therapist[]>(THERAPISTS);
  const [branches, setBranches] = useState<Branch[]>(NUAT_THAI_BRANCHES);
  const [services, setServices] = useState<MassageService[]>(MASSAGE_SERVICES);
  const [syncPulse, setSyncPulse] = useState<boolean>(false);
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('bgc');
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<Appointment | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pendingIncomingCount, setPendingIncomingCount] = useState<number>(0);

  // Active appointment for direct viewing in BookingConfirmationView
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const currentBranch = branches.find(b => b.id === selectedBranch) || branches[0] || NUAT_THAI_BRANCHES[0];

  // Fetch therapists, branches, services, and stats on load
  const fetchAllData = async () => {
    try {
      const [resTherapists, resStats, resBranches, resServices] = await Promise.all([
        fetch('/api/therapists').catch(() => null),
        fetch('/api/frontdesk/stats').catch(() => null),
        fetch('/api/branches').catch(() => null),
        fetch('/api/services').catch(() => null)
      ]);
      if (resTherapists && resTherapists.ok) {
        const data = await resTherapists.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) {
          setTherapists(data);
        }
      }
      if (resStats && resStats.ok) {
        const stats = await resStats.json().catch(() => null);
        if (stats && typeof stats.pendingIncoming === 'number') {
          setPendingIncomingCount(stats.pendingIncoming);
        }
      }
      if (resBranches && resBranches.ok) {
        const branchData = await resBranches.json().catch(() => null);
        if (Array.isArray(branchData) && branchData.length > 0) {
          setBranches(branchData);
        }
      }
      if (resServices && resServices.ok) {
        const serviceData = await resServices.json().catch(() => null);
        if (Array.isArray(serviceData) && serviceData.length > 0) {
          setServices(serviceData);
        }
      }
    } catch (err) {
      console.warn('Backend API note (expected if deployed as static GitHub Pages):', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerSyncPulse = () => {
    setSyncPulse(true);
    setTimeout(() => setSyncPulse(false), 2000);
  };

  // Lookup booking by reference code or email
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const query = lookupQuery.trim();
      const res = await fetch(`/api/bookings?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data: Appointment[] = await res.json();
      
      const found = data.find(a => 
        a.confirmationCode.toLowerCase() === query.toLowerCase() ||
        a.client.email.toLowerCase() === query.toLowerCase() ||
        a.client.fullName.toLowerCase().includes(query.toLowerCase())
      );

      if (found) {
        setLookupResult(found);
      } else {
        setLookupError(`No booking found matching "${query}". Please check your confirmation code or email.`);
      }
    } catch (err: any) {
      setLookupError('Failed to search bookings. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Primary Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setViewingAppointment(null);
          setActiveTab(tab);
        }}
        onOpenLookup={() => {
          setShowLookupModal(true);
          setLookupResult(null);
          setLookupError(null);
        }}
        syncPulse={syncPulse}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        branches={branches}
        pendingIncomingCount={pendingIncomingCount}
      />

      {/* Breadcrumb / Operations Header */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 text-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-bold text-[#20124D] uppercase tracking-wider text-xs">Nuat Thai</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium hidden md:inline">{currentBranch.name}</span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span className="font-semibold text-slate-800">
            {activeTab === 'frontdesk' ? 'Front Desk Reception & Attendant Dispatch' :
             activeTab === 'customer' ? 'Customer Self-Service Booking Panel' :
             activeTab === 'booking' ? 'Traditional Therapy Booking' :
             activeTab === 'admin' ? 'Administration (Branches & Services Management)' :
             activeTab === 'schedule' ? 'Therapists & Shift Roster' :
             activeTab === 'appointments' ? 'Treatment Pod Appointments' :
             activeTab === 'loyalty' ? 'Customer Suki Loyalty Cards & Stamps' :
             activeTab === 'analytics' ? 'Operations & Revenue Analytics' :
             activeTab === 'emails' ? 'Automated Communications (Email & SMS)' : 'Ambiance AI Studio'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pendingIncomingCount > 0 && activeTab !== 'frontdesk' && (
            <button
              onClick={() => setActiveTab('frontdesk')}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
            >
              <span>{pendingIncomingCount} Incoming Requests</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#20124D] rounded-full flex items-center justify-center text-[#F0D204] font-black text-[10px]">
              NT
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{currentBranch.name}</span>
          </div>
        </div>
      </div>

      {/* Main App Content */}
      <main className="flex-1 pb-16">
        {/* If viewing single confirmed appointment from lookup */}
        {viewingAppointment ? (
          <BookingConfirmationView
            appointment={viewingAppointment}
            onBookAnother={() => {
              setViewingAppointment(null);
              setActiveTab('booking');
            }}
            onViewEmailCenter={() => {
              setViewingAppointment(null);
              setActiveTab('emails');
            }}
            onUpdateStatus={(updated) => setViewingAppointment(updated)}
          />
        ) : (
          <>
            {activeTab === 'frontdesk' && (
              <FrontDeskPanel
                therapists={therapists}
                selectedBranch={selectedBranch}
                branches={branches}
                services={services}
                onNavigateToLoyalty={(phoneOrName) => {
                  setActiveTab('loyalty');
                }}
                onAppointmentsChanged={() => {
                  triggerSyncPulse();
                  fetchAllData();
                }}
              />
            )}

            {activeTab === 'customer' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <CustomerBookingPanel
                  therapists={therapists}
                  branches={branches}
                  services={services}
                  onBookingCreated={(apt) => {
                    triggerSyncPulse();
                    setViewingAppointment(apt);
                  }}
                />
              </div>
            )}

            {activeTab === 'booking' && (
              <BookingFlow
                therapists={therapists}
                branches={branches}
                services={services}
                selectedBranch={selectedBranch}
                onBookingCreated={(apt) => {
                  triggerSyncPulse();
                  setViewingAppointment(apt);
                }}
                onViewEmails={() => setActiveTab('emails')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                branches={branches}
                services={services}
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
                onBranchesUpdated={(updated) => {
                  setBranches(updated);
                  triggerSyncPulse();
                }}
                onServicesUpdated={(updated) => {
                  setServices(updated);
                  triggerSyncPulse();
                }}
              />
            )}

            {activeTab === 'schedule' && (
              <StaffScheduling
                therapists={therapists}
                onTherapistUpdated={(updated) => setTherapists(updated)}
                onSyncTriggered={triggerSyncPulse}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsManager
                therapists={therapists}
                onAppointmentsChanged={triggerSyncPulse}
              />
            )}

            {activeTab === 'loyalty' && (
              <LoyaltyCardsManager
                selectedBranch={selectedBranch}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {activeTab === 'emails' && (
              <AutomatedEmailCenter />
            )}

            {activeTab === 'studio' && (
              <AmbianceStudio />
            )}
          </>
        )}
      </main>

      {/* Lookup Booking Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Lookup Spa Reservation</h3>
              </div>
              <button
                onClick={() => setShowLookupModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your booking reference code (e.g. <span className="font-mono font-semibold text-blue-600">SRN-10842</span>) or the email address used during checkout.
            </p>

            <form onSubmit={handleLookup} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. SRN-10842 or client@example.com"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition cursor-pointer disabled:opacity-50"
                >
                  {lookupLoading ? 'Searching...' : 'Find Booking'}
                </button>
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </form>

            {lookupResult && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {lookupResult.confirmationCode}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    {lookupResult.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lookupResult.serviceName}</h4>
                  <p className="text-slate-600 mt-0.5">
                    {lookupResult.date} at {lookupResult.startTime} ({lookupResult.durationMinutes} min) with {lookupResult.therapistName}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Guest: <strong>{lookupResult.client.fullName}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingAppointment(lookupResult);
                      setShowLookupModal(false);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition cursor-pointer"
                  >
                    View Full Confirmation &amp; Receipt →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nuat Thai Footer */}
      <footer className="mt-auto border-t border-purple-900/20 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#20124D] tracking-tight font-serif">NUAT THAI FOOT AND BODY MASSAGE</span>
            <span>• Established 2005 • {currentBranch.address}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="text-[#20124D] font-semibold italic">“There is no instrument more precise than human hand”</span>
            <span>•</span>
            <span>Instant SMS &amp; Email Alerts</span>
          </div>
        </div>
      </footer>

      {/* Floating Customer Booking Panel Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-customer-panel-btn"
          onClick={() => setShowCustomerDrawer(true)}
          className="px-4 py-2.5 rounded-full bg-[#20124D] hover:bg-[#2f1b72] text-[#F0D204] text-xs font-bold shadow-2xl border border-[#F0D204]/50 flex items-center gap-2.5 cursor-pointer transition hover:scale-105 active:scale-95"
        >
          <Smartphone className="w-4 h-4 text-[#F0D204]" />
          <span>Customer Booking Panel</span>
          <span className="w-2 h-2 rounded-full bg-[#F0D204] animate-pulse" />
        </button>
      </div>

      {/* Customer Booking Drawer / Modal */}
      {showCustomerDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <CustomerBookingPanel
              therapists={therapists}
              isDrawerMode={true}
              onClose={() => setShowCustomerDrawer(false)}
              onBookingCreated={(apt) => {
                triggerSyncPulse();
                setShowCustomerDrawer(false);
                setViewingAppointment(apt);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
