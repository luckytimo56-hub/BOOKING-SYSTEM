import React from 'react';
import { Sparkles, Calendar, Users, BarChart3, Mail, Image as ImageIcon, Search, ShieldCheck, Smartphone, MapPin, Award, Bell, Settings } from 'lucide-react';
import { NUAT_THAI_BRANCHES } from '../data/initialData';
import { Branch } from '../types';

export type ActiveTab = 'frontdesk' | 'booking' | 'customer' | 'schedule' | 'appointments' | 'admin' | 'loyalty' | 'analytics' | 'emails' | 'studio';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenLookup: () => void;
  syncPulse: boolean;
  selectedBranch?: string;
  onSelectBranch?: (branchId: string) => void;
  pendingIncomingCount?: number;
  branches?: Branch[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLookup,
  syncPulse,
  selectedBranch = 'bgc',
  onSelectBranch,
  pendingIncomingCount = 0,
  branches = NUAT_THAI_BRANCHES
}) => {
  const currentBranches = branches && branches.length > 0 ? branches : NUAT_THAI_BRANCHES;
  return (
    <header className="sticky top-0 z-40 bg-[#1e1045] text-white border-b border-purple-950/60 shadow-md">
      {/* Top Banner with Nuat Thai Motto & Telemetry */}
      <div className="bg-[#150b33] border-b border-purple-900/40 px-4 py-1.5 text-xs text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-3">
            {/* Live slot status */}
            <div className="flex items-center gap-1.5 bg-[#251554] px-2 py-0.5 rounded border border-purple-800/60">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 ${syncPulse ? 'scale-150' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">Live Pod Sync</span>
            </div>

            {/* Famous Motto from Nuat Thai Official Website */}
            <div className="hidden md:flex items-center gap-1 text-[11px] text-yellow-200/90 italic font-serif">
              <span className="w-1 h-3 bg-yellow-400 rounded-xs inline-block mr-1"></span>
              <span>“There is no instrument more precise than human hand”</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-purple-200 text-xs">
            {/* Branch Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#251554] px-2.5 py-0.5 rounded border border-purple-800/60 text-[11px]">
              <MapPin className="w-3 h-3 text-yellow-400" />
              <span className="text-purple-300">Branch:</span>
              <select 
                value={selectedBranch}
                onChange={(e) => onSelectBranch && onSelectBranch(e.target.value)}
                className="bg-transparent text-yellow-300 font-semibold focus:outline-none cursor-pointer"
              >
                {currentBranches.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#1e1045] text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>PCI-DSS Secured</span>
            </div>

            <button
              id="header-lookup-btn"
              onClick={onOpenLookup}
              className="flex items-center gap-1.5 hover:text-yellow-300 text-purple-200 text-xs font-semibold transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-yellow-400" />
              <span>Lookup Reservation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Authentic NUAT THAI Brand Logo Matching image.png */}
          <div 
            onClick={() => setActiveTab('booking')}
            className="flex items-center gap-3 cursor-pointer group py-1"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#F0D204] to-[#c99a02] rounded-xl flex items-center justify-center font-black text-[#1e1045] text-xl shadow-lg border border-yellow-200">
              NT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-[#F0D204] font-serif uppercase">
                  NUAT THAI
                </span>
                <span className="px-2 py-0.5 bg-[#2c1766] text-yellow-300 text-[10px] font-extrabold rounded-md uppercase border border-yellow-400/30 tracking-wider">
                  Foot &amp; Body Massage
                </span>
              </div>
              <p className="text-[11px] text-purple-200 font-medium">
                Professional Acupressure Since 2005 • Nuat Thai PH
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#160b33] p-1.5 rounded-xl border border-purple-900/60">
            <button
              id="tab-frontdesk"
              onClick={() => setActiveTab('frontdesk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                activeTab === 'frontdesk'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${activeTab === 'frontdesk' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Front Desk Ops</span>
              {pendingIncomingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-black bg-amber-500 text-slate-950 rounded-full animate-pulse shadow-xs">
                  {pendingIncomingCount}
                </span>
              )}
            </button>

            <button
              id="tab-booking"
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'booking'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'booking' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Book Treatment</span>
            </button>

            <button
              id="tab-customer"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'customer' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Customer Panel</span>
            </button>

            <button
              id="tab-schedule"
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'schedule' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Therapists &amp; Shifts</span>
            </button>

            <button
              id="tab-appointments"
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'appointments' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Pod Roster</span>
            </button>

            <button
              id="tab-loyalty"
              onClick={() => setActiveTab('loyalty')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'loyalty'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${activeTab === 'loyalty' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Loyalty &amp; Suki Cards</span>
            </button>

            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Admin Panel</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'analytics' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Revenue &amp; Analytics</span>
            </button>

            <button
              id="tab-emails"
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'emails'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <Mail className={`w-3.5 h-3.5 ${activeTab === 'emails' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Email &amp; SMS Center</span>
            </button>

            <button
              id="tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-[#F0D204] text-[#1e1045] shadow-sm font-bold'
                  : 'text-purple-200 hover:bg-[#28155e] hover:text-white'
              }`}
            >
              <ImageIcon className={`w-3.5 h-3.5 ${activeTab === 'studio' ? 'text-[#1e1045]' : 'text-yellow-400'}`} />
              <span>Ambiance AI</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              id="quick-book-cta"
              onClick={() => setActiveTab('booking')}
              className="px-4 py-2.5 rounded-xl bg-[#F0D204] hover:bg-[#ffe338] text-[#1e1045] text-xs font-extrabold uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#1e1045]" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 border-t border-purple-900/60 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('frontdesk')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold flex items-center gap-1.5 ${
              activeTab === 'frontdesk' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            <span>Front Desk</span>
            {pendingIncomingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-500 text-slate-950 rounded-full">
                {pendingIncomingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'booking' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Book
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'customer' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Customer Panel
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'schedule' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'appointments' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Pods
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'loyalty' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Loyalty Cards
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'admin' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Admin Panel
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'analytics' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'emails' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Email &amp; SMS
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold ${
              activeTab === 'studio' ? 'bg-[#F0D204] text-[#1e1045]' : 'text-purple-200'
            }`}
          >
            Ambiance AI
          </button>
        </div>
      </div>
    </header>
  );
};
