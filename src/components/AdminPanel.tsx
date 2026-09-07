import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Clock, 
  Layers, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  DollarSign, 
  Tag, 
  ShieldCheck, 
  Sliders, 
  ArrowRight,
  ExternalLink,
  Flame,
  Check
} from 'lucide-react';
import { Branch, MassageService, ServiceCategory, PressurePreference, ServiceDurationOption } from '../types';

interface AdminPanelProps {
  branches: Branch[];
  services: MassageService[];
  selectedBranch: string;
  onSelectBranch: (branchId: string) => void;
  onBranchesUpdated: (branches: Branch[]) => void;
  onServicesUpdated: (services: MassageService[]) => void;
}

const SERVICE_CATEGORIES: Record<ServiceCategory, { id: ServiceCategory; label: string; color: string }> = {
  'thai-traditional': { id: 'thai-traditional', label: 'Thai Traditional', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  'foot-spa': { id: 'foot-spa', label: 'Foot Spa & Reflexology', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  'aromatherapy': { id: 'aromatherapy', label: 'Aromatherapy & Oils', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  'therapeutic': { id: 'therapeutic', label: 'Therapeutic & Clinical', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  'relaxation': { id: 'relaxation', label: 'Relaxation & Swedish', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  'specialty': { id: 'specialty', label: 'Specialty & Twin', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  'express': { id: 'express', label: 'Express Targeted', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  'holistic': { id: 'holistic', label: 'Holistic Herbal', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
};

const ALL_PRESSURE_LEVELS: PressurePreference[] = [
  'Light / Gentle',
  'Medium / Balanced',
  'Firm',
  'Deep Tissue / Intensive',
  'Deep Acupressure'
];

const PRESET_SERVICE_IMAGES = [
  { label: 'Traditional Thai Dry Massage', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  { label: 'Foot Spa & Reflexology Soak', url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Warm Aromatherapy Essential Oils', url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80' },
  { label: 'Steamed Herbal Compress Poultice', url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80' },
  { label: 'Swedish Sanctuary Lavender Knead', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { label: 'Four-Hands Twin Massage Synchrony', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  branches,
  services,
  selectedBranch,
  onSelectBranch,
  onBranchesUpdated,
  onServicesUpdated
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'branches' | 'services'>('branches');
  
  // Search & Filters
  const [branchSearch, setBranchSearch] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all');

  // Branch Modals
  const [showAddBranchModal, setShowAddBranchModal] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [branchFormError, setBranchFormError] = useState<string | null>(null);
  const [branchSubmitting, setBranchSubmitting] = useState<boolean>(false);

  // Branch Form State
  const [branchFormName, setBranchFormName] = useState<string>('');
  const [branchFormAddress, setBranchFormAddress] = useState<string>('');
  const [branchFormPhone, setBranchFormPhone] = useState<string>('+63 (02) 8800-0000');
  const [branchFormCity, setBranchFormCity] = useState<string>('Metro Manila');
  const [branchFormHours, setBranchFormHours] = useState<string>('10:00 AM - 11:00 PM Daily');
  const [branchFormPods, setBranchFormPods] = useState<number>(10);
  const [branchFormActive, setBranchFormActive] = useState<boolean>(true);

  // Service Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<MassageService | null>(null);
  const [deletingService, setDeletingService] = useState<MassageService | null>(null);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);
  const [serviceSubmitting, setServiceSubmitting] = useState<boolean>(false);

  // Service Form State
  const [serviceFormName, setServiceFormName] = useState<string>('');
  const [serviceFormCategory, setServiceFormCategory] = useState<ServiceCategory>('thai-traditional');
  const [serviceFormTagline, setServiceFormTagline] = useState<string>('');
  const [serviceFormDescription, setServiceFormDescription] = useState<string>('');
  const [serviceFormImage, setServiceFormImage] = useState<string>(PRESET_SERVICE_IMAGES[0].url);
  const [serviceFormPopular, setServiceFormPopular] = useState<boolean>(false);
  const [serviceFormDurations, setServiceFormDurations] = useState<ServiceDurationOption[]>([
    { durationMinutes: 60, price: 550 },
    { durationMinutes: 90, price: 795 }
  ]);
  const [serviceFormPressure, setServiceFormPressure] = useState<PressurePreference[]>([
    'Medium / Balanced',
    'Firm'
  ]);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- BRANCH ACTIONS ---
  const handleOpenAddBranch = () => {
    setBranchFormName('');
    setBranchFormAddress('');
    setBranchFormPhone('+63 (02) 8800-0000');
    setBranchFormCity('Metro Manila');
    setBranchFormHours('10:00 AM - 11:00 PM Daily');
    setBranchFormPods(10);
    setBranchFormActive(true);
    setBranchFormError(null);
    setShowAddBranchModal(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchFormName(branch.name);
    setBranchFormAddress(branch.address);
    setBranchFormPhone(branch.phone || '');
    setBranchFormCity(branch.city || 'Metro Manila');
    setBranchFormHours(branch.openingHours || '10:00 AM - 11:00 PM Daily');
    setBranchFormPods(branch.podCount || 10);
    setBranchFormActive(branch.isActive !== false);
    setBranchFormError(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormName.trim()) {
      setBranchFormError('Branch name is required');
      return;
    }
    if (!branchFormAddress.trim()) {
      setBranchFormError('Branch address is required');
      return;
    }

    setBranchSubmitting(true);
    setBranchFormError(null);

    try {
      if (editingBranch) {
        // Edit Branch
        const res = await fetch(`/api/branches/${editingBranch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: branchFormName.trim(),
            address: branchFormAddress.trim(),
            phone: branchFormPhone.trim(),
            city: branchFormCity.trim(),
            openingHours: branchFormHours.trim(),
            podCount: branchFormPods,
            isActive: branchFormActive
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update branch');
        }

        const updatedBranch: Branch = await res.json();
        const updatedList = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
        onBranchesUpdated(updatedList);
        setEditingBranch(null);
        showToast(`Branch "${updatedBranch.name}" successfully updated!`);
      } else {
        // Add Branch
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: branchFormName.trim(),
            address: branchFormAddress.trim(),
            phone: branchFormPhone.trim(),
            city: branchFormCity.trim(),
            openingHours: branchFormHours.trim(),
            podCount: branchFormPods
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create branch');
        }

        const newBranch: Branch = await res.json();
        const updatedList = [...branches, newBranch];
        onBranchesUpdated(updatedList);
        setShowAddBranchModal(false);
        showToast(`New branch "${newBranch.name}" successfully created!`);
      }
    } catch (err: any) {
      setBranchFormError(err.message || 'An error occurred while saving the branch');
    } finally {
      setBranchSubmitting(false);
    }
  };

  const handleConfirmDeleteBranch = async () => {
    if (!deletingBranch) return;

    if (branches.length <= 1) {
      showToast('Cannot delete the only remaining branch. At least one branch must remain active.');
      setDeletingBranch(null);
      return;
    }

    setBranchSubmitting(true);
    try {
      const res = await fetch(`/api/branches/${deletingBranch.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete branch');
      }

      const updatedList = branches.filter(b => b.id !== deletingBranch.id);
      onBranchesUpdated(updatedList);

      // If the currently selected branch was deleted, switch to the first remaining branch
      if (selectedBranch === deletingBranch.id && updatedList.length > 0) {
        onSelectBranch(updatedList[0].id);
      }

      showToast(`Branch "${deletingBranch.name}" has been removed.`);
      setDeletingBranch(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete branch');
    } finally {
      setBranchSubmitting(false);
    }
  };

  // --- SERVICE ACTIONS ---
  const handleOpenAddService = () => {
    setServiceFormName('');
    setServiceFormCategory('thai-traditional');
    setServiceFormTagline('Authentic therapeutic Thai bodywork and muscle relaxation');
    setServiceFormDescription('Nuat Thai authentic dry acupressure and gentle yoga stretches to release muscular stress, align postural balance, and soothe body fatigue.');
    setServiceFormImage(PRESET_SERVICE_IMAGES[0].url);
    setServiceFormPopular(false);
    setServiceFormDurations([
      { durationMinutes: 60, price: 550 },
      { durationMinutes: 90, price: 795 }
    ]);
    setServiceFormPressure(['Medium / Balanced', 'Firm']);
    setServiceFormError(null);
    setShowAddServiceModal(true);
  };

  const handleOpenEditService = (service: MassageService) => {
    setEditingService(service);
    setServiceFormName(service.name);
    setServiceFormCategory(service.category);
    setServiceFormTagline(service.tagline);
    setServiceFormDescription(service.description);
    setServiceFormImage(service.image);
    setServiceFormPopular(Boolean(service.popular));
    setServiceFormDurations(service.durations && service.durations.length > 0 ? [...service.durations] : [{ durationMinutes: 60, price: 550 }]);
    setServiceFormPressure(service.pressureLevels && service.pressureLevels.length > 0 ? [...service.pressureLevels] : ['Medium / Balanced', 'Firm']);
    setServiceFormError(null);
  };

  const handleAddDurationTier = () => {
    setServiceFormDurations(prev => [
      ...prev,
      { durationMinutes: 120, price: 995 }
    ]);
  };

  const handleRemoveDurationTier = (index: number) => {
    if (serviceFormDurations.length <= 1) {
      setServiceFormError('At least one duration and price option is required.');
      return;
    }
    setServiceFormDurations(prev => prev.filter((_, i) => i !== index));
  };

  const handleDurationTierChange = (index: number, field: 'durationMinutes' | 'price', val: number) => {
    setServiceFormDurations(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleTogglePressure = (level: PressurePreference) => {
    setServiceFormPressure(prev => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(p => p !== level);
      }
      return [...prev, level];
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormName.trim()) {
      setServiceFormError('Service name is required');
      return;
    }
    if (!serviceFormDurations || serviceFormDurations.length === 0) {
      setServiceFormError('At least one duration and price tier is required');
      return;
    }

    setServiceSubmitting(true);
    setServiceFormError(null);

    try {
      if (editingService) {
        // Edit Service
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceFormName.trim(),
            category: serviceFormCategory,
            tagline: serviceFormTagline.trim(),
            description: serviceFormDescription.trim(),
            image: serviceFormImage.trim(),
            popular: serviceFormPopular,
            durations: serviceFormDurations,
            pressureLevels: serviceFormPressure
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update service');
        }

        const updatedService: MassageService = await res.json();
        const updatedList = services.map(s => s.id === updatedService.id ? updatedService : s);
        onServicesUpdated(updatedList);
        setEditingService(null);
        showToast(`Service "${updatedService.name}" successfully updated!`);
      } else {
        // Add Service
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceFormName.trim(),
            category: serviceFormCategory,
            tagline: serviceFormTagline.trim(),
            description: serviceFormDescription.trim(),
            image: serviceFormImage.trim(),
            popular: serviceFormPopular,
            durations: serviceFormDurations,
            pressureLevels: serviceFormPressure
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create service');
        }

        const newService: MassageService = await res.json();
        const updatedList = [...services, newService];
        onServicesUpdated(updatedList);
        setShowAddServiceModal(false);
        showToast(`New service "${newService.name}" successfully added to the catalog!`);
      }
    } catch (err: any) {
      setServiceFormError(err.message || 'An error occurred while saving the service');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!deletingService) return;

    if (services.length <= 1) {
      showToast('Cannot delete the only remaining service. At least one service is required.');
      setDeletingService(null);
      return;
    }

    setServiceSubmitting(true);
    try {
      const res = await fetch(`/api/services/${deletingService.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete service');
      }

      const updatedList = services.filter(s => s.id !== deletingService.id);
      onServicesUpdated(updatedList);
      showToast(`Massage service "${deletingService.name}" has been deleted.`);
      setDeletingService(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service');
    } finally {
      setServiceSubmitting(false);
    }
  };

  // Filtered branches
  const filteredBranches = branches.filter(b => {
    const q = branchSearch.toLowerCase();
    return b.name.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q));
  });

  // Filtered services
  const filteredServices = services.filter(s => {
    const q = serviceSearch.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) ||
      s.tagline.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);
    const matchesCategory = serviceCategoryFilter === 'all' || s.category === serviceCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1e1045] text-white px-5 py-3 rounded-xl shadow-2xl border border-yellow-400/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Main Admin Header */}
      <div className="bg-gradient-to-r from-[#1e1045] via-[#2d1266] to-[#160b33] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 text-[#F0D204] rounded-full text-xs font-bold border border-yellow-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nuat Thai Franchise Master Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Admin Management Console
            </h1>
            <p className="text-purple-200 text-sm max-w-2xl leading-relaxed">
              Add and remove branch locations, adjust therapy pod configurations, and manage the official massage service catalog with real-time pricing and duration tiers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Branches</p>
              <p className="text-2xl font-black text-yellow-400">{branches.length}</p>
              <p className="text-[10px] text-purple-300">Active Outlets</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Services</p>
              <p className="text-2xl font-black text-yellow-400">{services.length}</p>
              <p className="text-[10px] text-purple-300">Active Treatments</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <p className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Total Pods</p>
              <p className="text-2xl font-black text-yellow-400">
                {branches.reduce((acc, b) => acc + (b.podCount || 10), 0)}
              </p>
              <p className="text-[10px] text-purple-300">Therapy Capacity</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 pt-5 border-t border-purple-900/60 flex flex-wrap gap-2">
          <button
            id="admin-tab-branches"
            onClick={() => setActiveAdminSubTab('branches')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeAdminSubTab === 'branches'
                ? 'bg-[#F0D204] text-[#1e1045] shadow-lg shadow-yellow-500/20'
                : 'bg-white/10 text-purple-200 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Branches & Locations ({branches.length})</span>
          </button>
          <button
            id="admin-tab-services"
            onClick={() => setActiveAdminSubTab('services')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeAdminSubTab === 'services'
                ? 'bg-[#F0D204] text-[#1e1045] shadow-lg shadow-yellow-500/20'
                : 'bg-white/10 text-purple-200 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Massage Services & Pricing ({services.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: BRANCH MANAGEMENT */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'branches' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
                placeholder="Search branch name, address, city..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
              />
              {branchSearch && (
                <button 
                  onClick={() => setBranchSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500 hidden md:inline">
                Showing {filteredBranches.length} of {branches.length} branches
              </span>
              <button
                id="btn-add-branch"
                onClick={handleOpenAddBranch}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1045] hover:bg-[#2c1363] text-white font-bold text-sm rounded-xl transition shadow-sm hover:shadow cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F0D204]" />
                <span>Add New Branch</span>
              </button>
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => {
              const isCurrent = selectedBranch === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                    isCurrent 
                      ? 'border-purple-500 shadow-md ring-2 ring-purple-500/20' 
                      : 'border-slate-200 hover:border-purple-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Card Header & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        {branch.city && (
                          <span className="inline-block text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full mb-1.5 border border-purple-100">
                            {branch.city}
                          </span>
                        )}
                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {branch.name}
                        </h3>
                      </div>
                      {isCurrent ? (
                        <span className="shrink-0 px-2.5 py-1 bg-yellow-400 text-slate-950 text-[11px] font-black rounded-lg shadow-xs">
                          Active Branch
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectBranch(branch.id)}
                          className="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-semibold hover:underline cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                    </div>

                    {/* Details List */}
                    <div className="space-y-2.5 text-xs text-slate-600 my-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <a href={`tel:${branch.phone}`} className="hover:text-purple-700 hover:underline">
                          {branch.phone || 'No phone set'}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{branch.openingHours || '10:00 AM - 11:00 PM Daily'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">
                          {branch.podCount || 10} Private Therapy Pods
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditBranch(branch)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-purple-50 hover:text-purple-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingBranch(branch)}
                      disabled={branches.length <= 1}
                      title={branches.length <= 1 ? 'Cannot delete only remaining branch' : 'Remove this branch'}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                        branches.length <= 1
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBranches.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No branches match your search</h3>
              <p className="text-xs text-slate-500">Try modifying your keyword or add a new branch location.</p>
              <button
                onClick={handleOpenAddBranch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e1045] text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" />
                <span>Add Branch</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MASSAGE SERVICES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'services' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Search service name, tagline..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
                />
              </div>

              {/* Category Filter */}
              <select
                value={serviceCategoryFilter}
                onChange={e => setServiceCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">All Categories</option>
                {Object.values(SERVICE_CATEGORIES).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <span className="text-xs text-slate-500 hidden md:inline">
                {filteredServices.length} treatment services available
              </span>
              <button
                id="btn-add-service"
                onClick={handleOpenAddService}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1045] hover:bg-[#2c1363] text-white font-bold text-sm rounded-xl transition shadow-sm hover:shadow cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F0D204]" />
                <span>Add Massage Service</span>
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map(service => {
              const catInfo = SERVICE_CATEGORIES[service.category] || { label: service.category, color: 'bg-slate-100 text-slate-800' };

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Image & Badges */}
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {service.popular && (
                          <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs">
                            <Flame className="w-3 h-3 fill-slate-950" />
                            <span>Signature / Popular</span>
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-black text-base drop-shadow-sm leading-tight">
                          {service.name}
                        </h3>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs font-semibold text-purple-900 leading-snug">
                        {service.tagline}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Duration & Price Tiers */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Duration &amp; Pricing Options
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {service.durations.map((d, i) => (
                            <span 
                              key={i}
                              className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 border border-slate-200/80"
                            >
                              {d.durationMinutes} min &bull; <span className="text-purple-700">₱{d.price.toLocaleString()}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pressure Levels */}
                      {service.pressureLevels && service.pressureLevels.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Pressure Levels
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {service.pressureLevels.map(p => (
                              <span key={p} className="text-[10px] bg-purple-50 text-purple-800 font-medium px-2 py-0.5 rounded-md">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditService(service)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-purple-50 hover:text-purple-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Service</span>
                    </button>

                    <button
                      onClick={() => setDeletingService(service)}
                      disabled={services.length <= 1}
                      title={services.length <= 1 ? 'Cannot delete only remaining service' : 'Delete service'}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                        services.length <= 1
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No services match your filters</h3>
              <p className="text-xs text-slate-500">Try changing category or clearing your search query.</p>
              <button
                onClick={handleOpenAddService}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e1045] text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" />
                <span>Add Service</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BRANCH */}
      {/* ========================================================================= */}
      {(showAddBranchModal || editingBranch) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#1e1045] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingBranch ? 'Edit Branch Location' : 'Add New Nuat Thai Branch'}
                  </h3>
                  <p className="text-xs text-purple-200">
                    {editingBranch ? 'Update location, phone, and pod capacity' : 'Provision a new franchise branch location'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddBranchModal(false);
                  setEditingBranch(null);
                }}
                className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              {branchFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{branchFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={branchFormName}
                  onChange={e => setBranchFormName(e.target.value)}
                  placeholder="e.g. Nuat Thai Alabang Town Center"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Metro Region
                  </label>
                  <input
                    type="text"
                    value={branchFormCity}
                    onChange={e => setBranchFormCity(e.target.value)}
                    placeholder="e.g. Muntinlupa City, Metro Manila"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={branchFormPhone}
                    onChange={e => setBranchFormPhone(e.target.value)}
                    placeholder="e.g. +63 (02) 8771-2299"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={branchFormAddress}
                  onChange={e => setBranchFormAddress(e.target.value)}
                  placeholder="e.g. 2nd Floor, Expansion Wing, Alabang Town Center, Commerce Ave"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={branchFormHours}
                    onChange={e => setBranchFormHours(e.target.value)}
                    placeholder="e.g. 10:00 AM - 11:00 PM Daily"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Therapy Pod Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={branchFormPods}
                    onChange={e => setBranchFormPods(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBranchModal(false);
                    setEditingBranch(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={branchSubmitting}
                  className="px-5 py-2 bg-[#1e1045] hover:bg-[#2c1363] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {branchSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE BRANCH CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Remove Branch Location?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingBranch.name}"</span>?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl mt-2 font-medium">
                This will immediately remove this outlet from customer booking dropdowns, the receptionist console, and the Suki loyalty program.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Keep Branch
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBranch}
                disabled={branchSubmitting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-60"
              >
                {branchSubmitting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MASSAGE SERVICE */}
      {/* ========================================================================= */}
      {(showAddServiceModal || editingService) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#1e1045] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingService ? 'Edit Massage Service' : 'Add New Massage Treatment Service'}
                  </h3>
                  <p className="text-xs text-purple-200">
                    Configure service name, category, duration tiers, and pricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddServiceModal(false);
                  setEditingService(null);
                }}
                className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {serviceFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{serviceFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceFormName}
                    onChange={e => setServiceFormName(e.target.value)}
                    placeholder="e.g. Traditional Herbal Ventosa Bodywork"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={serviceFormCategory}
                    onChange={e => setServiceFormCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  >
                    {Object.values(SERVICE_CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Brief Subtitle
                </label>
                <input
                  type="text"
                  value={serviceFormTagline}
                  onChange={e => setServiceFormTagline(e.target.value)}
                  placeholder="e.g. Ancient Thai healing acupressure with warm herbal compresses"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={serviceFormDescription}
                  onChange={e => setServiceFormDescription(e.target.value)}
                  placeholder="Explain the therapeutic benefits, technique, and client experience..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Duration & Pricing Tiers */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Duration &amp; Pricing Tiers</span>
                    <p className="text-[11px] text-slate-500">Provide at least one duration (minutes) and price in PHP</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDurationTier}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {serviceFormDurations.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Duration:</span>
                        <input
                          type="number"
                          min={15}
                          step={15}
                          value={tier.durationMinutes}
                          onChange={e => handleDurationTierChange(idx, 'durationMinutes', parseInt(e.target.value) || 60)}
                          className="w-20 px-2 py-1 text-xs font-bold border border-slate-300 rounded-md text-center"
                        />
                        <span className="text-xs text-slate-600">mins</span>
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Price (₱):</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={tier.price}
                          onChange={e => handleDurationTierChange(idx, 'price', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-xs font-bold border border-slate-300 rounded-md text-purple-700"
                        />
                      </div>

                      {serviceFormDurations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDurationTier(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Pressure Levels */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Supported Pressure Levels
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PRESSURE_LEVELS.map(level => {
                    const selected = serviceFormPressure.includes(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleTogglePressure(level)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                          selected
                            ? 'bg-purple-900 text-white border-purple-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-yellow-400" />}
                        <span>{level}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Photo Image URL
                </label>
                <input
                  type="url"
                  value={serviceFormImage}
                  onChange={e => setServiceFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none mb-2"
                />

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">Or Pick a Standard Spa Photo Preset:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_SERVICE_IMAGES.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setServiceFormImage(preset.url)}
                        className={`text-left p-1.5 rounded-lg border text-[11px] truncate flex items-center gap-2 cursor-pointer transition ${
                          serviceFormImage === preset.url
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-6 h-6 rounded object-cover" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="service-popular"
                  checked={serviceFormPopular}
                  onChange={e => setServiceFormPopular(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="service-popular" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                  <span>Highlight as "Signature / Popular Service" in booking menus</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSubmitting}
                  className="px-5 py-2 bg-[#1e1045] hover:bg-[#2c1363] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {serviceSubmitting ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE SERVICE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Delete Massage Service?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{deletingService.name}"</span> from the catalog?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl mt-2 font-medium">
                Clients and reception staff will no longer be able to select this treatment for new reservations.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingService(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Keep Service
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                disabled={serviceSubmitting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-60"
              >
                {serviceSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
