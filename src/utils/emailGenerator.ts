import { Appointment } from '../types';

export function generateBookingConfirmationHtml(appointment: Appointment): string {
  const { client, serviceName, durationMinutes, therapistName, date, startTime, endTime, roomNumber, pricing, confirmationCode } = appointment;
  
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formatCurrency = (val: number) => `₱${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f5fa; color: #1e1b2e; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 18px rgba(32,18,77,0.08); border: 1px solid #e5e0f0; }
    .header { background: #20124D; padding: 34px 28px; text-align: center; color: #ffffff; position: relative; border-bottom: 4px solid #F0D204; }
    .header .logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; color: #F0D204; text-transform: uppercase; margin: 0; }
    .header .subtitle { margin: 6px 0 0 0; font-size: 13px; color: #d6ccff; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; }
    .header .motto { margin: 10px 0 0 0; font-size: 13px; font-style: italic; color: #FDF498; opacity: 0.95; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; background: #FDF9D2; color: #735700; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #F0D204; }
    .confirmation-banner { background: #f9f7ff; border: 2px dashed #d7c9f8; border-radius: 10px; padding: 18px; margin: 22px 0; text-align: center; }
    .conf-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #645688; font-weight: 700; margin-bottom: 4px; }
    .conf-code { font-size: 28px; font-weight: 800; color: #20124D; letter-spacing: 3px; font-family: monospace; }
    .detail-card { background: #fbfaff; border-radius: 10px; padding: 20px; margin-bottom: 24px; border-left: 5px solid #20124D; border: 1px solid #ebe5f8; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0eafc; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #5f5778; font-weight: 500; }
    .detail-val { font-weight: 700; color: #1e143f; text-align: right; }
    .price-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .price-table td { padding: 7px 0; }
    .total-row td { font-weight: 800; font-size: 16px; border-top: 2px solid #20124D; padding-top: 10px; color: #20124D; }
    .prep-box { background: #fbf9ec; border-radius: 10px; padding: 18px; margin-top: 24px; border: 1px solid #f3e69f; font-size: 13px; color: #56460c; }
    .prep-box h4 { margin: 0 0 8px 0; font-size: 14px; color: #3b3003; font-weight: 700; }
    .prep-box ul { margin: 0; padding-left: 18px; }
    .prep-box li { margin-bottom: 4px; }
    .footer { background: #160b35; padding: 24px 28px; text-align: center; font-size: 12px; color: #b4a8dc; }
    .footer strong { color: #F0D204; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NUAT THAI</h1>
      <p class="subtitle">Foot and Body Massage • Since 2005</p>
      <p class="motto">“There is no instrument more precise than human hand”</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge">Appointment Confirmed</span>
        <h2 style="font-size: 22px; color: #20124D; margin: 12px 0 6px 0;">Sawasdee Khrap / Kha, ${client.fullName}!</h2>
        <p style="font-size: 14px; color: #5c5576; margin: 0;">Your authentic Thai therapy session is confirmed. Authentic acupressure and gentle stretching await.</p>
      </div>

      <div class="confirmation-banner">
        <div class="conf-label">Nuat Thai Reference Code</div>
        <div class="conf-code">${confirmationCode}</div>
        <div style="font-size: 12px; color: #6d648c; margin-top: 6px;">Please present this code at reception upon arrival</div>
      </div>

      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Treatment</span>
          <span class="detail-val">${serviceName} (${durationMinutes} min)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Certified Therapist</span>
          <span class="detail-val">${therapistName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-val">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time Window</span>
          <span class="detail-val">${startTime} - ${endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pod / Room</span>
          <span class="detail-val">${roomNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pressure Preference</span>
          <span class="detail-val">${client.pressurePreference}</span>
        </div>
        ${client.focusAreas.length > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Focus Areas</span>
          <span class="detail-val">${client.focusAreas.join(', ')}</span>
        </div>` : ''}
      </div>

      <h3 style="font-size: 16px; color: #20124D; margin-bottom: 8px;">Official Payment Receipt</h3>
      <table class="price-table">
        <tr>
          <td>${serviceName} (${durationMinutes}m)</td>
          <td style="text-align: right;">${formatCurrency(pricing.servicePrice)}</td>
        </tr>
        ${appointment.addons && appointment.addons.length > 0 ? appointment.addons.map(a => `
        <tr>
          <td style="color: #6d648c;">+ ${a.name}</td>
          <td style="text-align: right;">${formatCurrency(a.price)}</td>
        </tr>`).join('') : ''}
        ${pricing.tip > 0 ? `
        <tr>
          <td>Therapist Gratuity</td>
          <td style="text-align: right;">${formatCurrency(pricing.tip)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td>Total Booking Value</td>
          <td style="text-align: right;">${formatCurrency(pricing.total)}</td>
        </tr>
        <tr>
          <td style="color: #0b814a; font-weight: 700;">Amount Paid (${appointment.payment.cardBrand || 'Card'})</td>
          <td style="text-align: right; color: #0b814a; font-weight: 700;">${formatCurrency(pricing.amountPaid)}</td>
        </tr>
        ${pricing.balanceDue > 0 ? `
        <tr>
          <td style="color: #92400e; font-weight: 700;">Balance Due at Front Desk</td>
          <td style="text-align: right; color: #92400e; font-weight: 700;">${formatCurrency(pricing.balanceDue)}</td>
        </tr>` : ''}
      </table>

      <div class="prep-box">
        <h4>🌿 Nuat Thai Guest Etiquette & Preparation</h4>
        <ul>
          <li><strong>Warm Foot Bath:</strong> Please arrive 10-15 minutes prior to enjoy your complimentary sea-salt and kaffir lime foot soak.</li>
          <li><strong>Thai Attire:</strong> For traditional dry Thai massage, clean, loose Thai pajama pants and top will be provided in your treatment pod.</li>
          <li><strong>Herbal Tea:</strong> Enjoy complimentary brewed pandan or ginger tea served after your therapy to harmonize digestion.</li>
          <li><strong>Acupressure Feedback:</strong> Inform your therapist anytime if you would like firmer or softer sen line pressure.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p><strong>NUAT THAI MASSAGE THERAPY AND FOOT SPA</strong></p>
      <p>Nationwide Franchises • Professional Acupressure Since 2005</p>
      <p>Need to reschedule? Call our branch concierge or use the online reservation lookup with your code <strong>${confirmationCode}</strong>.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateGoogleCalendarUrl(appointment: Appointment): string {
  const { serviceName, date, startTime, endTime, therapistName, roomNumber, confirmationCode } = appointment;
  const startIso = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const endIso = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
  
  const title = encodeURIComponent(`Nuat Thai: ${serviceName}`);
  const details = encodeURIComponent(
    `Nuat Thai Foot and Body Massage\nConfirmation: ${confirmationCode}\nTherapist: ${therapistName}\nPod/Suite: ${roomNumber}\n“There is no instrument more precise than human hand”`
  );
  const location = encodeURIComponent(`Nuat Thai Therapy Pod ${roomNumber}, Metro Manila`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function generateIcsFileContent(appointment: Appointment): string {
  const { serviceName, date, startTime, endTime, therapistName, roomNumber, confirmationCode } = appointment;
  const startIso = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const endIso = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nuat Thai Philippines//Massage Booking Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${confirmationCode}@nuatthaiph.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:Nuat Thai: ${serviceName}`,
    `DESCRIPTION:Therapist: ${therapistName}\\nPod: ${roomNumber}\\nCode: ${confirmationCode}\\nThere is no instrument more precise than human hand`,
    `LOCATION:Nuat Thai Pod ${roomNumber}, Philippines`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}
