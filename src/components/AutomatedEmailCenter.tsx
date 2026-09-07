import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageSquare, Send, CheckCircle2, Clock, RefreshCw, Eye, 
  Download, Sparkles, Filter, Search, AlertCircle, Settings, Phone, 
  Smartphone, Check, Bell, ShieldCheck, ArrowRight
} from 'lucide-react';
import { EmailNotification, NotificationSettings, SmsLog } from '../types';

export const AutomatedEmailCenter: React.FC = () => {
  // Navigation between Emails, SMS, and Settings
  const [activeChannel, setActiveChannel] = useState<'emails' | 'sms' | 'settings'>('emails');

  // Email State
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [loadingEmails, setLoadingEmails] = useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [emailFilterType, setEmailFilterType] = useState<string>('all');
  const [emailSearchQuery, setEmailSearchQuery] = useState<string>('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // SMS State
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [loadingSms, setLoadingSms] = useState<boolean>(true);
  const [selectedSms, setSelectedSms] = useState<SmsLog | null>(null);
  const [smsSearchQuery, setSmsSearchQuery] = useState<string>('');
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('+1 (555) 349-8821');
  const [testGuestName, setTestGuestName] = useState<string>('Victoria Sterling');
  const [isSendingTestSms, setIsSendingTestSms] = useState<boolean>(false);

  // Notification Settings State
  const [settings, setSettings] = useState<NotificationSettings>({
    smsEnabled: true,
    emailEnabled: true,
    reminder24hSms: true,
    instantConfirmationSms: true,
    reminder2hSms: true,
    senderPhone: '+1 (415) 890-7721',
    smsGateway: 'Twilio SMS Cloud Gateway (Active)'
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch all data
  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setEmails(data || []);
      if (data && data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchSmsLogs = async () => {
    setLoadingSms(true);
    try {
      const res = await fetch('/api/sms');
      const data = await res.json();
      setSmsLogs(data || []);
      if (data && data.length > 0 && !selectedSms) {
        setSelectedSms(data[0]);
      }
    } catch (err) {
      console.error('Error fetching SMS logs:', err);
    } finally {
      setLoadingSms(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notifications/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchSmsLogs();
    fetchSettings();
  }, []);

  // Toggle master SMS setting directly
  const handleToggleSms = async (newValue: boolean) => {
    const updated = { ...settings, smsEnabled: newValue };
    setSettings(updated);
    setSavingSettings(true);
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsEnabled: newValue })
      });
      if (res.ok) {
        setActionNotice(
          newValue 
            ? 'SMS Notifications Enabled: Clients will now receive appointment reminders via text in addition to emails.' 
            : 'SMS Notifications Paused: Clients will only receive email notifications.'
        );
        setTimeout(() => setActionNotice(null), 4500);
      }
    } catch (err) {
      console.error('Error updating SMS setting:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Update specific sub-setting
  const handleUpdateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      setActionNotice('Communication preferences updated.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  // Send Test SMS
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) return;

    setIsSendingTestSms(true);
    try {
      const res = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhoneNumber,
          name: testGuestName || 'Valued Guest',
          type: 'reminder_24h'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActionNotice(`Test SMS reminder successfully dispatched to ${testPhoneNumber}!`);
        setTimeout(() => setActionNotice(null), 4500);
        fetchSmsLogs();
        if (data.log) {
          setSelectedSms(data.log);
        }
      }
    } catch (err) {
      console.error('Error sending test SMS:', err);
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handleResendEmail = async (emailId: string) => {
    setResendingId(emailId);
    try {
      const res = await fetch(`/api/emails/resend/${emailId}`, { method: 'POST' });
      if (res.ok) {
        setActionNotice('Automated confirmation email re-dispatched to client inbox!');
        setTimeout(() => setActionNotice(null), 4000);
        fetchEmails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  const handleDownloadHtml = (email: EmailNotification) => {
    const content = email.htmlContent || email.htmlBody || '';
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `email-${email.type}-${email.id}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredEmails = emails.filter(e => {
    const matchesType = emailFilterType === 'all' || e.type === emailFilterType;
    const matchesSearch = emailSearchQuery === '' || 
      e.recipientEmail.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
      e.recipientName.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(emailSearchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredSms = smsLogs.filter(s => {
    const matchesSearch = smsSearchQuery === '' ||
      s.recipientPhone.toLowerCase().includes(smsSearchQuery.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(smsSearchQuery.toLowerCase()) ||
      s.message.toLowerCase().includes(smsSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
        return { label: 'Instant Confirmation', color: 'bg-blue-100 text-blue-700' };
      case 'reminder_24h':
        return { label: '24h Reminder', color: 'bg-indigo-100 text-indigo-700' };
      case 'cancellation':
      case 'cancelled':
        return { label: 'Cancellation Notice', color: 'bg-rose-100 text-rose-700' };
      case 'rescheduled':
        return { label: 'Reschedule Alert', color: 'bg-amber-100 text-amber-800' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-sans font-bold text-slate-900">Client Communications &amp; Dispatch</h1>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              Automated Engine
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Manage automated email receipts, calendar invites, and instant SMS text reminders dispatched to clients.
          </p>
        </div>

        {/* Action Controls & Master SMS Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Master SMS Toggle Button in Header */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Smartphone className={`w-4 h-4 ${settings.smsEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-800 block leading-tight">SMS Reminders</span>
                <span className="text-[10px] text-slate-500 block">Text &amp; Email Sync</span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="header-sms-toggle-btn"
              type="button"
              role="switch"
              aria-checked={settings.smsEnabled}
              disabled={savingSettings}
              onClick={() => handleToggleSms(!settings.smsEnabled)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.smsEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => {
              fetchEmails();
              fetchSmsLogs();
              fetchSettings();
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingEmails || loadingSms ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Prominent SMS Notification Settings Callout Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        settings.smsEnabled 
          ? 'bg-blue-50/70 border-blue-200 text-slate-800' 
          : 'bg-amber-50/70 border-amber-200 text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              settings.smsEnabled ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  SMS Text Notifications: {settings.smsEnabled ? 'Enabled & Active' : 'Currently Disabled'}
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  settings.smsEnabled ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {settings.smsEnabled ? 'Dual Dispatch (Email + SMS)' : 'Email Only'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {settings.smsEnabled 
                  ? 'Clients will automatically receive appointment reminders, reschedule alerts, and prep instructions via SMS text message in addition to their email confirmation.'
                  : 'Clients currently only receive email confirmations. Enable SMS to ensure clients never miss appointment reminders on their mobile phones.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <button
              id="banner-sms-toggle-btn"
              type="button"
              onClick={() => handleToggleSms(!settings.smsEnabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                settings.smsEnabled 
                  ? 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{settings.smsEnabled ? 'Disable SMS' : 'Enable SMS Reminders'}</span>
            </button>

            <button
              onClick={() => setActiveChannel('settings')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Settings</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Channel Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          id="channel-tab-emails"
          onClick={() => setActiveChannel('emails')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeChannel === 'emails'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Confirmations &amp; Receipts</span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
            {emails.length}
          </span>
        </button>

        <button
          id="channel-tab-sms"
          onClick={() => setActiveChannel('sms')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeChannel === 'sms'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>SMS Text Messages</span>
          <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">
            {smsLogs.length}
          </span>
          {settings.smsEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Gateway Active" />
          )}
        </button>

        <button
          id="channel-tab-settings"
          onClick={() => setActiveChannel('settings')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeChannel === 'settings'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Communications Settings</span>
        </button>
      </div>

      {/* VIEW 1: EMAIL DISPATCH LOGS */}
      {activeChannel === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Sent Emails (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter / Search Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  placeholder="Search email, recipient, or subject..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={emailFilterType}
                  onChange={(e) => setEmailFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 w-full"
                >
                  <option value="all">All Email Types</option>
                  <option value="booking_confirmation">Booking Confirmations</option>
                  <option value="reminder_24h">24h Reminders</option>
                  <option value="rescheduled">Reschedules</option>
                  <option value="cancelled">Cancellations</option>
                </select>
              </div>
            </div>

            {/* Email Item Feed */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {loadingEmails ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading dispatch logs...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <Mail className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">No emails match current filter.</p>
                </div>
              ) : (
                filteredEmails.map((item) => {
                  const isSelected = selectedEmail?.id === item.id;
                  const badge = getEmailTypeLabel(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEmail(item)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-sans font-bold text-slate-900 mt-2 line-clamp-1">
                        {item.subject}
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{item.recipientName}</span>
                        <span className="truncate max-w-[150px] font-mono">{item.recipientEmail}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Rendered Email Preview (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedEmail ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                {/* Email meta bar */}
                <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-0.5">
                      Dispatched Email Preview
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{selectedEmail.subject}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      To: <strong className="text-slate-200">{selectedEmail.recipientName}</strong> &lt;{selectedEmail.recipientEmail}&gt;
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={resendingId === selectedEmail.id}
                      onClick={() => handleResendEmail(selectedEmail.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{resendingId === selectedEmail.id ? 'Sending...' : 'Resend Email'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadHtml(selectedEmail)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Download HTML"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Iframe for safe HTML preview */}
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
                  <iframe
                    title="Rendered Email Preview"
                    srcDoc={selectedEmail.htmlContent || selectedEmail.htmlBody}
                    className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-inner"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-[700px] flex flex-col items-center justify-center">
                <Mail className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="font-sans font-bold text-slate-900">Select an email to view preview</h3>
                <p className="text-xs text-slate-500 mt-1">Choose any dispatched confirmation or reminder from the left list.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SMS TEXT MESSAGES LOG */}
      {activeChannel === 'sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Sent SMS Messages (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Test SMS Box */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  Dispatch Test SMS Reminder
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  Live Test
                </span>
              </div>

              <form onSubmit={handleSendTestSms} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={testGuestName}
                      onChange={(e) => setTestGuestName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingTestSms}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isSendingTestSms ? 'Transmitting via Gateway...' : 'Send Test Text Reminder'}</span>
                </button>
              </form>
            </div>

            {/* Search filter for SMS */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={smsSearchQuery}
                  onChange={(e) => setSmsSearchQuery(e.target.value)}
                  placeholder="Filter by phone number or client name..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* SMS Feed */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {loadingSms ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading SMS records...</p>
                </div>
              ) : filteredSms.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <Smartphone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">No SMS reminders sent yet.</p>
                </div>
              ) : (
                filteredSms.map((item) => {
                  const isSelected = selectedSms?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSms(item)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-slate-900">{item.recipientName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-mono text-slate-700 font-medium">{item.recipientPhone}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Mobile Device Message Preview (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
              {/* Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-0.5">
                    Client Mobile Device Preview
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {selectedSms ? `Thread with ${selectedSms.recipientName}` : 'SMS Message Viewer'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-mono text-[11px]">
                    Sender: {settings.senderPhone}
                  </span>
                </div>
              </div>

              {/* Realistic Smartphone Screen Simulator */}
              <div className="flex-1 bg-slate-100 p-6 flex items-center justify-center overflow-y-auto">
                <div className="w-full max-w-sm bg-white rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[560px]">
                  {/* Phone Notch & Status Bar */}
                  <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-[11px]">
                    <span className="font-bold">9:41</span>
                    <div className="w-16 h-3.5 bg-slate-800 rounded-full" />
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span>5G</span>
                      <span className="font-semibold">100%</span>
                    </div>
                  </div>

                  {/* Message Contact Header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Serenity Spa Concierge</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{settings.senderPhone}</p>
                    </div>
                  </div>

                  {/* Message Bubble Thread Area */}
                  <div className="flex-1 p-4 bg-[#F2F4F7] space-y-4 overflow-y-auto">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 bg-white/80 px-2 py-0.5 rounded-full shadow-xs">
                        Today • Automated Gateway
                      </span>
                    </div>

                    {selectedSms ? (
                      <div className="space-y-3">
                        {/* Received Message Bubble */}
                        <div className="flex flex-col items-start max-w-[88%]">
                          <div className="bg-slate-200 text-slate-900 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-sm">
                            {selectedSms.message}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 ml-1">
                            Delivered • {new Date(selectedSms.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Simulated quick response options */}
                        <div className="flex items-center gap-1.5 pt-2">
                          <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full text-blue-600 font-semibold shadow-xs">
                            C (Confirm)
                          </span>
                          <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-600 shadow-xs">
                            Directions
                          </span>
                          <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-600 shadow-xs">
                            Reschedule
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-400 text-xs">
                        Select an SMS log on the left to preview message thread.
                      </div>
                    )}
                  </div>

                  {/* Text Input Footer Simulation */}
                  <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                      iMessage / Text Message
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMMUNICATIONS SETTINGS */}
      {activeChannel === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Card: SMS Notification Engine Settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full mb-1 inline-block">
                  Primary Text Dispatch
                </span>
                <h2 className="text-lg font-bold text-slate-900">SMS Notification &amp; Text Reminders</h2>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Allows clients to receive appointment reminders, reschedule confirmations, and suite entry instructions via text message in addition to emails.
                </p>
              </div>

              {/* Big Interactive Master Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${settings.smsEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                  {settings.smsEnabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  id="settings-sms-master-toggle"
                  type="button"
                  role="switch"
                  aria-checked={settings.smsEnabled}
                  onClick={() => handleToggleSms(!settings.smsEnabled)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.smsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.smsEnabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Granular Notification Rules */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                Automated SMS Trigger Rules
              </h3>

              {/* Rule 1: 24-Hour Reminder */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">24-Hour Pre-Appointment Reminder</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sends an automated SMS 24 hours prior with therapist name, start time, room number, and cancellation policy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSetting('reminder24hSms', !settings.reminder24hSms)}
                  disabled={!settings.smsEnabled}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    settings.reminder24hSms && settings.smsEnabled ? 'bg-blue-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    settings.reminder24hSms && settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule 2: Instant Confirmation */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900">Instant Booking Confirmation Text</span>
                  <p className="text-xs text-slate-500">
                    Dispatches an immediate text receipt with confirmation reference code as soon as the client books.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSetting('instantConfirmationSms', !settings.instantConfirmationSms)}
                  disabled={!settings.smsEnabled}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    settings.instantConfirmationSms && settings.smsEnabled ? 'bg-blue-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    settings.instantConfirmationSms && settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule 3: 2-Hour Pre-Arrival Instructions */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900">2-Hour Day-of Arrival &amp; Parking Instructions</span>
                  <p className="text-xs text-slate-500">
                    Sends front gate access code, parking instructions, and a request to arrive 10 minutes prior for relaxation tea.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSetting('reminder2hSms', !settings.reminder2hSms)}
                  disabled={!settings.smsEnabled}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    settings.reminder2hSms && settings.smsEnabled ? 'bg-blue-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    settings.reminder2hSms && settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Gateway & Sender Information */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">SMS Gateway Provider</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  {settings.smsGateway}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Outbound Sender Number</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                  {settings.senderPhone}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
