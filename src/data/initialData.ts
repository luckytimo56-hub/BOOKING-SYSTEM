import { MassageService, AddonOption, Therapist, Appointment, MonthlyRevenuePoint, LoyaltyCard, Branch } from '../types';

export const NUAT_THAI_BRANCHES: Branch[] = [
  { 
    id: 'bgc', 
    name: 'Nuat Thai BGC High Street', 
    address: '2nd Floor, Bonifacio High Street, Taguig City', 
    phone: '+63 (02) 8812-9842',
    city: 'Taguig City, Metro Manila',
    openingHours: '10:00 AM - 11:00 PM Daily',
    podCount: 12,
    isActive: true
  },
  { 
    id: 'makati', 
    name: 'Nuat Thai Makati Salcedo', 
    address: 'Salcedo Village, L.P. Leviste St, Makati City', 
    phone: '+63 (02) 8894-3321',
    city: 'Makati City, Metro Manila',
    openingHours: '10:00 AM - 11:00 PM Daily',
    podCount: 10,
    isActive: true
  },
  { 
    id: 'ortigas', 
    name: 'Nuat Thai Ortigas Emerald', 
    address: 'G/F Emerald Mansion, Emerald Ave, Pasig City', 
    phone: '+63 (02) 8631-7712',
    city: 'Pasig City, Metro Manila',
    openingHours: '10:00 AM - 10:00 PM Daily',
    podCount: 8,
    isActive: true
  },
  { 
    id: 'cebu', 
    name: 'Nuat Thai Cebu IT Park (Origin)', 
    address: 'Skyrise 1, Cebu IT Park, Lahug, Cebu City', 
    phone: '+63 (32) 236-8841',
    city: 'Cebu City, Central Visayas',
    openingHours: '09:00 AM - 12:00 MN Daily',
    podCount: 16,
    isActive: true
  }
];

export const MASSAGE_SERVICES: MassageService[] = [
  {
    id: 'thai-traditional',
    name: 'Authentic Thai Body Massage',
    category: 'thai-traditional',
    tagline: 'Professional dry acupressure along Sen lines with assisted passive yoga stretching',
    description: 'Nuat Thai signature dry massage based on ancient Thai healing traditions since 2005. Applying rhythmic thumb and palm acupressure along energetic sen lines combined with gentle assisted stretching. Realigns postural balance and releases deep physical tension. Traditional Thai cotton pajamas provided; no oil used.',
    durations: [
      { durationMinutes: 60, price: 550 },
      { durationMinutes: 90, price: 795 },
      { durationMinutes: 120, price: 995 }
    ],
    recommendedAddons: ['thai-compress-ball', 'plai-balm'],
    pressureLevels: ['Medium / Balanced', 'Firm', 'Deep Acupressure'],
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'foot-spa-reflexology',
    name: 'Nuat Thai Foot Spa & Reflexology',
    category: 'foot-spa',
    tagline: 'Warm sea-salt herbal soak, wooden stick reflexology, and revitalizing calf relief',
    description: 'Specialized Thai reflexology stimulating internal organ vitality and micro-circulation through precise foot pressure points. Includes a warm sea-salt foot soak with kaffir lime, traditional wooden reflexology stick stimulation, cooling peppermint balm, and lower leg soothing strokes.',
    durations: [
      { durationMinutes: 45, price: 395 },
      { durationMinutes: 60, price: 495 },
      { durationMinutes: 90, price: 695 }
    ],
    recommendedAddons: ['peppermint-scrub', 'eye-pillow'],
    pressureLevels: ['Medium / Balanced', 'Firm'],
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'thai-aromatherapy-oil',
    name: 'Thai Aromatherapy & Herbal Hot Oil',
    category: 'aromatherapy',
    tagline: 'Flowing rhythmic strokes with warm organic lemongrass, plai, & lavender oils',
    description: 'A harmonious blend of Eastern acupressure and gentle gliding strokes using warmed virgin coconut and essential botanical oils. Calms mental stress, softens taut muscles, and restores inner equilibrium.',
    durations: [
      { durationMinutes: 60, price: 650 },
      { durationMinutes: 90, price: 895 },
      { durationMinutes: 120, price: 1150 }
    ],
    recommendedAddons: ['virgin-coconut-hot', 'eye-pillow'],
    pressureLevels: ['Light / Gentle', 'Medium / Balanced', 'Firm'],
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'luk-pra-kob-compress',
    name: 'Luk Pra Kob (Thai Herbal Hot Compress)',
    category: 'thai-traditional',
    tagline: 'Steamed medicinal herbal poultices pressed into aching meridians and joints',
    description: 'Traditional muslin poultices packed with organic steamed herbs—plai, lemongrass, kaffir lime, turmeric, and camphor—steamed to therapeutic warmth and pressed into Sen energy lines. Unsurpassed for chronic back soreness, stiffness, and inflammation.',
    durations: [
      { durationMinutes: 60, price: 750 },
      { durationMinutes: 90, price: 995 },
      { durationMinutes: 120, price: 1250 }
    ],
    recommendedAddons: ['plai-balm'],
    pressureLevels: ['Medium / Balanced', 'Firm', 'Deep Acupressure'],
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'swedish-relaxation',
    name: 'Swedish Sanctuary Full-Body Massage',
    category: 'relaxation',
    tagline: 'Classic Western long effleurage strokes for circulatory health and deep calmness',
    description: 'Classic European full-body relaxation utilizing smooth, rhythmic kneading and effleurage. Promotes restorative sleep, lowers blood pressure, and untangles everyday fatigue.',
    durations: [
      { durationMinutes: 60, price: 595 },
      { durationMinutes: 90, price: 795 }
    ],
    recommendedAddons: ['eye-pillow', 'peppermint-scrub'],
    pressureLevels: ['Light / Gentle', 'Medium / Balanced'],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'twin-four-hands',
    name: 'Twin Massage (Four-Hands Synchronization)',
    category: 'specialty',
    tagline: 'Choreographed dual-therapist bodywork for profound transcendent relaxation',
    description: 'Two skilled Nuat Thai practitioners work in rhythmic, synchronized choreography across the body. The mind is gently lulled into deep meditative peace as both sides of the body are relieved simultaneously.',
    durations: [
      { durationMinutes: 60, price: 1100 },
      { durationMinutes: 90, price: 1550 }
    ],
    recommendedAddons: ['virgin-coconut-hot'],
    pressureLevels: ['Medium / Balanced', 'Firm'],
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'ventosa-cupping',
    name: 'Ventosa Cupping & Deep Back Relief',
    category: 'therapeutic',
    tagline: 'Traditional vacuum fire cupping decompression with focused back acupressure',
    description: 'Glass suction cups create gentle decompression across the thoracic and lumbar spine to loosen rigid fascia, expel stagnant toxins, and speed muscular regeneration.',
    durations: [
      { durationMinutes: 60, price: 650 },
      { durationMinutes: 90, price: 850 }
    ],
    recommendedAddons: ['plai-balm'],
    pressureLevels: ['Firm', 'Deep Acupressure'],
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'express-head-neck-shoulder',
    name: 'Head, Neck & Shoulder Acupressure Express',
    category: 'express',
    tagline: 'Focused seated tension release for office desk posture & migraines',
    description: 'Fast, intensive acupressure targeting trapezoid knots, base of the skull, and shoulders. Perfect midday rejuvenation for busy professionals.',
    durations: [
      { durationMinutes: 30, price: 350 },
      { durationMinutes: 45, price: 450 }
    ],
    recommendedAddons: ['eye-pillow', 'plai-balm'],
    pressureLevels: ['Medium / Balanced', 'Firm'],
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'
  }
];

export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'thai-compress-ball',
    name: 'Steamed Thai Herbal Compress Ball (Luk Pra Kob)',
    description: 'Steamed organic lemongrass, turmeric, and plai compresses applied to tension points.',
    price: 180,
    extraMinutes: 15,
    icon: 'Sparkles'
  },
  {
    id: 'peppermint-scrub',
    name: 'Nuat Thai Sea Salt & Peppermint Foot Scrub',
    description: 'Exfoliating foot scrub with cooling menthol and steamed Thai herbal towel wrap.',
    price: 150,
    extraMinutes: 15,
    icon: 'Footprints'
  },
  {
    id: 'virgin-coconut-hot',
    name: 'Organic Virgin Coconut Hot Oil Upgrade',
    description: 'Warm cold-pressed virgin coconut oil deeply moisturizes and conditions dry skin.',
    price: 120,
    extraMinutes: 0,
    icon: 'Droplets'
  },
  {
    id: 'plai-balm',
    name: 'Authentic Thai Plai Herbal Balm Ointment',
    description: 'Traditional analgesic Thai herbal balm with camphor, menthol, and ginger extract.',
    price: 90,
    extraMinutes: 0,
    icon: 'Flame'
  },
  {
    id: 'eye-pillow',
    name: 'Acupressure Herbal Eye Pillow & Temple Rub',
    description: 'Cooling flaxseed & lavender eye mask paired with temple acupressure rub.',
    price: 110,
    extraMinutes: 10,
    icon: 'Brain'
  }
];

export const THERAPISTS: Therapist[] = [
  {
    id: 'therapist-1',
    name: 'Somchai Pradit',
    title: 'Master Thai Bodywork Practitioner (Wat Pho Certified)',
    licenseNumber: 'NT-LMT #0821',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    bio: '15+ years of dedicated practice in traditional Thai massage trained at the historic Wat Pho Traditional Medical School in Bangkok. Renowned for sen line precision and gentle assisted yoga stretches.',
    specialties: ['Authentic Thai Body Massage', 'Luk Pra Kob (Thai Herbal Hot Compress)', 'Ventosa Cupping & Deep Back Relief'],
    rating: 4.98,
    reviewCount: 428,
    workingDays: [1, 2, 3, 4, 5], // Mon - Fri
    shiftStart: '10:00',
    shiftEnd: '21:00',
    breakStart: '14:00',
    breakEnd: '15:00',
    roomNumber: 'Suite Siam 1',
    isActive: true
  },
  {
    id: 'therapist-2',
    name: 'Malinee Thongchai',
    title: 'Senior Foot Reflexologist & Thai Spa Specialist',
    licenseNumber: 'NT-LMT #1142',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    bio: 'Master of Thai reflexology zones and hot herbal compresses. Nuat Thai practitioner since 2012 with a gentle demeanor and deep restorative touch.',
    specialties: ['Nuat Thai Foot Spa & Reflexology', 'Thai Aromatherapy & Herbal Hot Oil', 'Luk Pra Kob (Thai Herbal Hot Compress)'],
    rating: 4.95,
    reviewCount: 382,
    workingDays: [2, 3, 4, 5, 6], // Tue - Sat
    shiftStart: '11:00',
    shiftEnd: '22:00',
    breakStart: '15:00',
    breakEnd: '16:00',
    roomNumber: 'Reflexology Pod 3',
    isActive: true
  },
  {
    id: 'therapist-3',
    name: 'Anong Rattanakosin',
    title: 'Lead Aromatherapist & Twin Massage Master',
    licenseNumber: 'NT-LMT #0947',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Specializing in essential botanical blends, synchronized twin massage, and soothing Swedish-Thai fusion. Known for calming chronic anxiety and muscular tension.',
    specialties: ['Thai Aromatherapy & Herbal Hot Oil', 'Twin Massage (Four-Hands Synchronization)', 'Swedish Sanctuary Full-Body Massage'],
    rating: 4.93,
    reviewCount: 310,
    workingDays: [0, 1, 3, 4, 6], // Sun, Mon, Wed, Thu, Sat
    shiftStart: '10:00',
    shiftEnd: '20:00',
    breakStart: '13:30',
    breakEnd: '14:30',
    roomNumber: 'Suite Ayutthaya 2',
    isActive: true
  },
  {
    id: 'therapist-4',
    name: 'Kanya Srisuwan',
    title: 'Clinical Acupressure & Ventosa Specialist',
    licenseNumber: 'NT-LMT #1408',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    bio: 'Expert in deep thumb pressure, myofascial trigger points, and neck/shoulder rehabilitation. Highly requested by desk workers and sports enthusiasts.',
    specialties: ['Authentic Thai Body Massage', 'Head, Neck & Shoulder Acupressure Express', 'Ventosa Cupping & Deep Back Relief'],
    rating: 4.91,
    reviewCount: 264,
    workingDays: [0, 2, 4, 5, 6], // Sun, Tue, Thu, Fri, Sat
    shiftStart: '12:00',
    shiftEnd: '23:00',
    breakStart: '16:00',
    breakEnd: '17:00',
    roomNumber: 'Suite Chiang Mai 4',
    isActive: true
  }
];

export const MOCK_MONTHLY_TREND: MonthlyRevenuePoint[] = [
  { month: 'Apr', revenue: 168400, bookings: 210, tips: 15400 },
  { month: 'May', revenue: 184500, bookings: 235, tips: 17200 },
  { month: 'Jun', revenue: 198200, bookings: 252, tips: 18900 },
  { month: 'Jul', revenue: 212000, bookings: 268, tips: 20500 },
  { month: 'Aug', revenue: 228400, bookings: 289, tips: 22100 },
  { month: 'Sep', revenue: 245600, bookings: 312, tips: 24300 }
];

const getFormattedDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-nt-101',
    confirmationCode: 'NT-88401',
    serviceId: 'thai-traditional',
    serviceName: 'Authentic Thai Body Massage',
    durationMinutes: 90,
    therapistId: 'therapist-1',
    therapistName: 'Somchai Pradit',
    therapistAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(0),
    startTime: '10:00',
    endTime: '11:30',
    roomNumber: 'Suite Siam 1',
    client: {
      fullName: 'Maria Santos',
      email: 'maria.santos@phmail.com',
      phone: '+63 (917) 554-9921',
      receiveSmsReminders: true,
      pressurePreference: 'Firm',
      focusAreas: ['Lower Back & Glutes', 'Upper Back & Shoulders'],
      medicalConditions: [],
      notes: 'Loves traditional stretching and firm thumb acupressure along spine.'
    },
    addons: [ADDON_OPTIONS[0]], // Herbal compress ball
    pricing: {
      servicePrice: 795,
      addonsTotal: 180,
      discount: 0,
      subtotal: 975,
      tax: 0,
      tip: 100,
      total: 1075,
      amountPaid: 1075,
      balanceDue: 0,
      paymentType: 'full'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889104',
      authCode: 'AUTH-9912',
      paidAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      last4: '8842',
      cardBrand: 'GCash / Visa'
    },
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    smsSent: true,
    smsSentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'apt-nt-102',
    confirmationCode: 'NT-88402',
    serviceId: 'foot-spa-reflexology',
    serviceName: 'Nuat Thai Foot Spa & Reflexology',
    durationMinutes: 60,
    therapistId: 'therapist-2',
    therapistName: 'Malinee Thongchai',
    therapistAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(0),
    startTime: '14:00',
    endTime: '15:00',
    roomNumber: 'Reflexology Pod 3',
    client: {
      fullName: 'Angelo Reyes',
      email: 'angelo.reyes@corporate.ph',
      phone: '+63 (918) 773-1092',
      receiveSmsReminders: true,
      pressurePreference: 'Medium / Balanced',
      focusAreas: ['Feet & Calves'],
      medicalConditions: [],
      notes: 'Desk worker with tired swollen feet after business trip.'
    },
    addons: [ADDON_OPTIONS[1]], // Peppermint scrub
    pricing: {
      servicePrice: 495,
      addonsTotal: 150,
      discount: 0,
      subtotal: 645,
      tax: 0,
      tip: 80,
      total: 725,
      amountPaid: 725,
      balanceDue: 0,
      paymentType: 'full'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889105',
      authCode: 'AUTH-9913',
      paidAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      last4: '1094',
      cardBrand: 'Mastercard'
    },
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    smsSent: true,
    smsSentAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'apt-nt-103',
    confirmationCode: 'NT-88403',
    serviceId: 'luk-pra-kob-compress',
    serviceName: 'Luk Pra Kob (Thai Herbal Hot Compress)',
    durationMinutes: 90,
    therapistId: 'therapist-1',
    therapistName: 'Somchai Pradit',
    therapistAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(1),
    startTime: '16:00',
    endTime: '17:30',
    roomNumber: 'Suite Siam 1',
    client: {
      fullName: 'Kirsten Dela Cruz',
      email: 'kirsten.delacruz@gmail.com',
      phone: '+63 (920) 441-8930',
      receiveSmsReminders: true,
      pressurePreference: 'Firm',
      focusAreas: ['Full Body', 'Lower Back'],
      medicalConditions: [],
      notes: 'Request extra steamed compress on neck and shoulder blades.'
    },
    addons: [ADDON_OPTIONS[3]], // Plai balm
    pricing: {
      servicePrice: 995,
      addonsTotal: 90,
      discount: 0,
      subtotal: 1085,
      tax: 0,
      tip: 150,
      total: 1235,
      amountPaid: 500,
      balanceDue: 735,
      paymentType: 'deposit'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889106',
      authCode: 'AUTH-9914',
      paidAt: new Date().toISOString(),
      last4: '4242',
      cardBrand: 'Visa'
    },
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date().toISOString(),
    smsSent: true,
    smsSentAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt-nt-104',
    confirmationCode: 'NT-88404',
    serviceId: 'thai-aromatherapy',
    serviceName: 'Thai Aromatherapy & Herbal Hot Oil',
    durationMinutes: 90,
    therapistId: 'therapist-2',
    therapistName: 'Malinee Thongchai',
    therapistAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(0), // Today
    startTime: '16:30',
    endTime: '18:00',
    roomNumber: 'Reflexology Pod 3',
    client: {
      fullName: 'Patricia Gomez',
      email: 'patricia.gomez@gmail.com',
      phone: '+63 (917) 432-8811',
      receiveSmsReminders: true,
      pressurePreference: 'Medium / Balanced',
      focusAreas: ['Neck & Shoulders', 'Upper Back'],
      medicalConditions: [],
      notes: 'Experiencing severe neck stiffness from long computer work. Prefers lemongrass aroma.'
    },
    addons: [ADDON_OPTIONS[1]], // Peppermint foot scrub
    pricing: {
      servicePrice: 945,
      addonsTotal: 150,
      discount: 0,
      subtotal: 1095,
      tax: 0,
      tip: 120,
      total: 1215,
      amountPaid: 1215,
      balanceDue: 0,
      paymentType: 'full'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889107',
      authCode: 'AUTH-9915',
      paidAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 mins ago
      last4: '9921',
      cardBrand: 'GCash'
    },
    status: 'pending', // INCOMING BOOKING AWAITING FRONT DESK ACCEPT/DECLINE
    emailSent: false,
    emailSentAt: '',
    smsSent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    branchId: 'bgc'
  },
  {
    id: 'apt-nt-105',
    confirmationCode: 'NT-88405',
    serviceId: 'thai-traditional',
    serviceName: 'Authentic Thai Body Massage',
    durationMinutes: 90,
    therapistId: 'therapist-1',
    therapistName: 'Somchai Pradit',
    therapistAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(0), // Today
    startTime: '18:30',
    endTime: '20:00',
    roomNumber: 'Suite Siam 1',
    client: {
      fullName: 'Dr. Roberto Mendoza',
      email: 'dr.mendoza@medcenter.ph',
      phone: '+63 (919) 881-2294',
      receiveSmsReminders: true,
      pressurePreference: 'Firm',
      focusAreas: ['Lower Back & Glutes', 'Legs & Hamstrings'],
      medicalConditions: [],
      notes: 'Surgeon coming off a 10-hour standing shift. Needs deep stretching.'
    },
    addons: [ADDON_OPTIONS[3]], // Plai balm
    pricing: {
      servicePrice: 795,
      addonsTotal: 90,
      discount: 0,
      subtotal: 885,
      tax: 0,
      tip: 150,
      total: 1035,
      amountPaid: 1035,
      balanceDue: 0,
      paymentType: 'full'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889108',
      authCode: 'AUTH-9916',
      paidAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(), // 22 mins ago
      last4: '4112',
      cardBrand: 'Visa'
    },
    status: 'pending', // INCOMING BOOKING AWAITING FRONT DESK ACCEPT/DECLINE
    emailSent: false,
    emailSentAt: '',
    smsSent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    branchId: 'bgc'
  },
  {
    id: 'apt-nt-106',
    confirmationCode: 'NT-88406',
    serviceId: 'foot-spa-reflexology',
    serviceName: 'Nuat Thai Foot Spa & Reflexology',
    durationMinutes: 60,
    therapistId: 'therapist-4',
    therapistName: 'Kanya Srisuwan',
    therapistAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(1), // Tomorrow
    startTime: '11:00',
    endTime: '12:00',
    roomNumber: 'Suite Chiang Mai 4',
    client: {
      fullName: 'Bea Alonzo-Tan',
      email: 'bea.tan@lifestyle.ph',
      phone: '+63 (922) 330-9944',
      receiveSmsReminders: true,
      pressurePreference: 'Light / Gentle',
      focusAreas: ['Feet & Calves'],
      medicalConditions: [],
      notes: 'First time visiting Nuat Thai! Request gentle herbal foot soak.'
    },
    addons: [ADDON_OPTIONS[2]], // Virgin coconut oil
    pricing: {
      servicePrice: 495,
      addonsTotal: 120,
      discount: 0,
      subtotal: 615,
      tax: 0,
      tip: 100,
      total: 715,
      amountPaid: 350,
      balanceDue: 365,
      paymentType: 'deposit'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889109',
      authCode: 'AUTH-9917',
      paidAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      last4: '5561',
      cardBrand: 'Mastercard'
    },
    status: 'pending', // INCOMING BOOKING
    emailSent: false,
    emailSentAt: '',
    smsSent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    branchId: 'bgc'
  },
  {
    id: 'apt-nt-100',
    confirmationCode: 'NT-88400',
    serviceId: 'ventosa-cupping',
    serviceName: 'Ventosa Cupping & Deep Back Relief',
    durationMinutes: 75,
    therapistId: 'therapist-3',
    therapistName: 'Anong Rattanakosin',
    therapistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    date: getFormattedDate(0), // Today
    startTime: '13:00',
    endTime: '14:15',
    roomNumber: 'Suite Ayutthaya 2',
    client: {
      fullName: 'Carlos Laurel',
      email: 'carlos.laurel@outlook.com',
      phone: '+63 (917) 620-1192',
      receiveSmsReminders: true,
      pressurePreference: 'Firm',
      focusAreas: ['Upper Back & Shoulders'],
      medicalConditions: [],
      notes: 'Currently in treatment session.'
    },
    addons: [],
    pricing: {
      servicePrice: 750,
      addonsTotal: 0,
      discount: 0,
      subtotal: 750,
      tax: 0,
      tip: 100,
      total: 850,
      amountPaid: 850,
      balanceDue: 0,
      paymentType: 'full'
    },
    payment: {
      method: 'credit_card',
      transactionId: 'TXN-NT-889100',
      authCode: 'AUTH-9910',
      paidAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      last4: '1182',
      cardBrand: 'GCash'
    },
    status: 'in-service', // CURRENTLY IN THERAPY POD
    emailSent: true,
    emailSentAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    smsSent: true,
    checkedInAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    branchId: 'bgc'
  }
];

export const INITIAL_LOYALTY_CARDS: LoyaltyCard[] = [
  {
    id: 'lc-101',
    cardNumber: 'NT-SUKI-88401',
    customerName: 'Maria Santos',
    customerPhone: '+63 (917) 554-9921',
    customerEmail: 'maria.santos@phmail.com',
    tier: 'Gold VIP',
    stamps: 8,
    stampsTarget: 10,
    points: 420,
    totalVisits: 14,
    lifetimeSpend: 11450,
    status: 'active',
    homeBranch: 'bgc',
    issuedAt: '2026-01-12T10:00:00.000Z',
    expiresAt: '2027-01-12T23:59:59.000Z',
    notes: 'Long-time patron of BGC High Street branch. Prefers Somchai for firm stretching.',
    rewards: [
      {
        id: 'rew-101',
        name: 'Complimentary Steamed Luk Pra Kob Hot Compress',
        description: 'Free herbal compress add-on earned from reaching 5-stamp milestone.',
        earnedAt: '2026-06-20T14:30:00.000Z',
        status: 'available'
      },
      {
        id: 'rew-100',
        name: 'Free 60m Authentic Thai Body Massage',
        description: 'Earned upon completion of previous 10-stamp card cycle.',
        earnedAt: '2026-04-10T11:00:00.000Z',
        status: 'redeemed',
        redeemedAt: '2026-05-02T16:15:00.000Z',
        redeemedByAdmin: 'Karen Alcantara (Branch Supervisor)'
      }
    ],
    auditTrail: [
      {
        id: 'aud-101-1',
        cardId: 'lc-101',
        cardNumber: 'NT-SUKI-88401',
        customerName: 'Maria Santos',
        timestamp: '2026-01-12T10:00:00.000Z',
        adminName: 'Karen Alcantara',
        adminRole: 'Branch Supervisor',
        action: 'CARD_CREATED',
        fieldChanged: 'Card Registration',
        previousValue: 'None',
        newValue: 'Active (Classic)',
        reason: 'New client registration at Nuat Thai BGC front desk.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-101-2',
        cardId: 'lc-101',
        cardNumber: 'NT-SUKI-88401',
        customerName: 'Maria Santos',
        timestamp: '2026-04-10T11:00:00.000Z',
        adminName: 'Somchai Pradit',
        adminRole: 'Head Therapist / Shift Lead',
        action: 'TIER_UPGRADED',
        fieldChanged: 'Membership Tier',
        previousValue: 'Silver Suki',
        newValue: 'Gold VIP',
        reason: 'Customer completed 10 visits within 3 months; authorized VIP upgrade with 10% perk.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-101-3',
        cardId: 'lc-101',
        cardNumber: 'NT-SUKI-88401',
        customerName: 'Maria Santos',
        timestamp: '2026-05-02T16:15:00.000Z',
        adminName: 'Karen Alcantara',
        adminRole: 'Branch Supervisor',
        action: 'REWARD_REDEEMED',
        fieldChanged: 'Reward Voucher',
        previousValue: 'Available (Free 60m Thai Body Massage)',
        newValue: 'Redeemed',
        reason: 'Client redeemed free session during Sunday afternoon appointment.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-101-4',
        cardId: 'lc-101',
        cardNumber: 'NT-SUKI-88401',
        customerName: 'Maria Santos',
        timestamp: '2026-09-01T15:30:00.000Z',
        adminName: 'Janice Morales',
        adminRole: 'Senior Receptionist',
        action: 'STAMPS_ADDED',
        fieldChanged: 'Stamps Count',
        previousValue: '7 stamps',
        newValue: '8 stamps',
        reason: 'Credited 90-minute Thai Body Massage session with Somchai.',
        branch: 'Nuat Thai BGC High Street'
      }
    ]
  },
  {
    id: 'lc-102',
    cardNumber: 'NT-SUKI-88402',
    customerName: 'Angelo Reyes',
    customerPhone: '+63 (918) 773-1092',
    customerEmail: 'angelo.reyes@corporate.ph',
    tier: 'Silver Suki',
    stamps: 4,
    stampsTarget: 10,
    points: 195,
    totalVisits: 6,
    lifetimeSpend: 4350,
    status: 'active',
    homeBranch: 'makati',
    issuedAt: '2026-03-05T14:00:00.000Z',
    expiresAt: '2027-03-05T23:59:59.000Z',
    notes: 'Regular foot reflexology client during weekday evenings.',
    rewards: [],
    auditTrail: [
      {
        id: 'aud-102-1',
        cardId: 'lc-102',
        cardNumber: 'NT-SUKI-88402',
        customerName: 'Angelo Reyes',
        timestamp: '2026-03-05T14:00:00.000Z',
        adminName: 'Malinee Thongchai',
        adminRole: 'Shift Supervisor',
        action: 'CARD_CREATED',
        fieldChanged: 'Card Registration',
        previousValue: 'None',
        newValue: 'Active (Classic)',
        reason: 'Client enrolled into Suki Rewards program after foot spa session.',
        branch: 'Nuat Thai Makati Salcedo'
      },
      {
        id: 'aud-102-2',
        cardId: 'lc-102',
        cardNumber: 'NT-SUKI-88402',
        customerName: 'Angelo Reyes',
        timestamp: '2026-06-18T19:00:00.000Z',
        adminName: 'Rico Dela Cruz',
        adminRole: 'Front Desk Officer',
        action: 'TIER_UPGRADED',
        fieldChanged: 'Membership Tier',
        previousValue: 'Classic',
        newValue: 'Silver Suki',
        reason: 'Reached 5+ visits threshold. Upgraded to Silver Suki tier.',
        branch: 'Nuat Thai Makati Salcedo'
      },
      {
        id: 'aud-102-3',
        cardId: 'lc-102',
        cardNumber: 'NT-SUKI-88402',
        customerName: 'Angelo Reyes',
        timestamp: '2026-08-20T17:45:00.000Z',
        adminName: 'Rico Dela Cruz',
        adminRole: 'Front Desk Officer',
        action: 'STAMPS_ADDED',
        fieldChanged: 'Stamps Count',
        previousValue: '3 stamps',
        newValue: '4 stamps',
        reason: 'Credited 60m Foot Reflexology with Peppermint Scrub.',
        branch: 'Nuat Thai Makati Salcedo'
      }
    ]
  },
  {
    id: 'lc-103',
    cardNumber: 'NT-SUKI-88403',
    customerName: 'Kirsten Dela Cruz',
    customerPhone: '+63 (920) 441-8930',
    customerEmail: 'kirsten.delacruz@gmail.com',
    tier: 'Platinum Royal',
    stamps: 9,
    stampsTarget: 10,
    points: 780,
    totalVisits: 22,
    lifetimeSpend: 19800,
    status: 'active',
    homeBranch: 'bgc',
    issuedAt: '2025-11-20T09:00:00.000Z',
    expiresAt: '2027-11-20T23:59:59.000Z',
    notes: 'VIP guest who frequently books herbal compress and twin massage therapy.',
    rewards: [
      {
        id: 'rew-103',
        name: 'Free 90m Luk Pra Kob Herbal Compress',
        description: 'Elite perk for achieving 20 lifetime visits at Nuat Thai.',
        earnedAt: '2026-07-15T12:00:00.000Z',
        status: 'available'
      }
    ],
    auditTrail: [
      {
        id: 'aud-103-1',
        cardId: 'lc-103',
        cardNumber: 'NT-SUKI-88403',
        customerName: 'Kirsten Dela Cruz',
        timestamp: '2025-11-20T09:00:00.000Z',
        adminName: 'Karen Alcantara',
        adminRole: 'Branch Supervisor',
        action: 'CARD_CREATED',
        fieldChanged: 'Card Registration',
        previousValue: 'None',
        newValue: 'Active',
        reason: 'Initial enrollment at BGC branch.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-103-2',
        cardId: 'lc-103',
        cardNumber: 'NT-SUKI-88403',
        customerName: 'Kirsten Dela Cruz',
        timestamp: '2026-05-10T16:00:00.000Z',
        adminName: 'Karen Alcantara',
        adminRole: 'Branch Supervisor',
        action: 'TIER_UPGRADED',
        fieldChanged: 'Membership Tier',
        previousValue: 'Gold VIP',
        newValue: 'Platinum Royal',
        reason: 'Customer reached ₱15,000+ spend tier. VIP priority room booking unlocked.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-103-3',
        cardId: 'lc-103',
        cardNumber: 'NT-SUKI-88403',
        customerName: 'Kirsten Dela Cruz',
        timestamp: '2026-07-15T12:00:00.000Z',
        adminName: 'Somchai Pradit',
        adminRole: 'Head Therapist',
        action: 'REWARD_GRANTED',
        fieldChanged: 'Special Reward Granted',
        previousValue: '0 rewards',
        newValue: '1 reward (Free 90m Luk Pra Kob)',
        reason: 'Awarded complimentary herbal compress for 20th session loyalty milestone.',
        branch: 'Nuat Thai BGC High Street'
      },
      {
        id: 'aud-103-4',
        cardId: 'lc-103',
        cardNumber: 'NT-SUKI-88403',
        customerName: 'Kirsten Dela Cruz',
        timestamp: '2026-08-30T18:00:00.000Z',
        adminName: 'Janice Morales',
        adminRole: 'Senior Receptionist',
        action: 'STAMPS_ADDED',
        fieldChanged: 'Stamps Count',
        previousValue: '8 stamps',
        newValue: '9 stamps (1 away from free session!)',
        reason: 'Credited 90m Herbal Compress session. Stamp 9 recorded.',
        branch: 'Nuat Thai BGC High Street'
      }
    ]
  },
  {
    id: 'lc-104',
    cardNumber: 'NT-SUKI-88404',
    customerName: 'Eduardo Gomez',
    customerPhone: '+63 (917) 882-3341',
    customerEmail: 'ed.gomez@manilacapital.com',
    tier: 'Classic',
    stamps: 2,
    stampsTarget: 10,
    points: 90,
    totalVisits: 2,
    lifetimeSpend: 1550,
    status: 'active',
    homeBranch: 'ortigas',
    issuedAt: '2026-08-10T11:00:00.000Z',
    expiresAt: '2027-08-10T23:59:59.000Z',
    notes: 'Corporate account client from Emerald Avenue.',
    rewards: [],
    auditTrail: [
      {
        id: 'aud-104-1',
        cardId: 'lc-104',
        cardNumber: 'NT-SUKI-88404',
        customerName: 'Eduardo Gomez',
        timestamp: '2026-08-10T11:00:00.000Z',
        adminName: 'Dante Ramos',
        adminRole: 'Branch Manager',
        action: 'CARD_CREATED',
        fieldChanged: 'Card Registration',
        previousValue: 'None',
        newValue: 'Active (Classic)',
        reason: 'Issued digital loyalty card at Ortigas Emerald branch.',
        branch: 'Nuat Thai Ortigas Emerald'
      }
    ]
  }
];
