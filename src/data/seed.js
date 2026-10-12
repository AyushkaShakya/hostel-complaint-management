// Realistic sample data for the demo. Every password is "demo123".
const DAY = 86400000;
const ago = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600000).toISOString();

const users = [
  { id: 'w_a', role: 'warden', name: 'Rakesh Verma', email: 'warden.a@hostel.edu', employeeId: 'EMP-2041', block: 'A' },
  { id: 'w_b', role: 'warden', name: 'Sunita Sharma', email: 'warden.b@hostel.edu', employeeId: 'EMP-2042', block: 'B' },
  { id: 'w_c', role: 'warden', name: 'Anil Yadav', email: 'warden.c@hostel.edu', employeeId: 'EMP-2043', block: 'C' },
  { id: 'w_d', role: 'warden', name: 'Priya Nair', email: 'warden.d@hostel.edu', employeeId: 'EMP-2044', block: 'D' },
  { id: 'cw_1', role: 'chief', name: 'Dr. Meena Kapoor', email: 'chief@hostel.edu', employeeId: 'EMP-1010' },
  { id: 'dn_1', role: 'dean', name: 'Prof. S. R. Iyer', email: 'dean@hostel.edu', employeeId: 'EMP-1001' },
  { id: 's1', role: 'student', name: 'Aarav Gupta', email: 'aarav@student.edu', rollNo: '22CS104', block: 'A', room: 'A-204', nickname: 'QuietOwl' },
  { id: 's2', role: 'student', name: 'Ishita Singh', email: 'ishita@student.edu', rollNo: '22EC118', block: 'B', room: 'B-112', nickname: 'Moonbeam' },
  { id: 's3', role: 'student', name: 'Rohan Mehta', email: 'rohan@student.edu', rollNo: '23ME031', block: 'A', room: 'A-310', nickname: 'NightCoder' },
  { id: 's4', role: 'student', name: 'Kavya Reddy', email: 'kavya@student.edu', rollNo: '23CS077', block: 'C', room: 'C-105', nickname: 'PaperCrane' },
  { id: 's5', role: 'student', name: 'Vikram Joshi', email: 'vikram@student.edu', rollNo: '21EE009', block: 'D', room: 'D-221', nickname: 'BlueKettle' },
  { id: 's6', role: 'student', name: 'Sneha Patel', email: 'sneha@student.edu', rollNo: '24BT012', block: 'B', room: 'B-207', nickname: 'Marigold' },
  { id: 's7', role: 'student', name: 'Arjun Das', email: 'arjun@student.edu', rollNo: '22CE045', block: 'C', room: 'C-318', nickname: 'Cobalt' },
  { id: 's8', role: 'student', name: 'Neha Rao', email: 'neha@student.edu', rollNo: '24CS150', block: 'D', room: 'D-109', nickname: 'Tamarind' },
].map((u) => ({ ...u, password: 'demo123' }));

const h = (status, days, by, note = '') => ({ status, at: ago(days), by, note });

function complaint(n, data) {
  const history = data.history;
  return {
    id: `c${n}`,
    code: `HC-${1000 + n}`,
    location: '',
    againstWardenId: null,
    hideFromChief: false,
    ...data,
    status: history[history.length - 1].status,
    createdAt: history[0].at,
    updatedAt: history[history.length - 1].at,
  };
}

const complaints = [
  complaint(1, { studentId: 's1', category: 'washroom', route: 'warden', block: 'A', title: 'Shower not draining on second floor', description: 'The shower in the second-floor washroom near A-204 has been draining very slowly for three days. Water collects up to the door.', location: 'A block, 2nd floor washroom', history: [h('pending', 1, 'Student')] }),
  complaint(2, { studentId: 's1', category: 'wifi', route: 'warden', block: 'A', title: 'Wi-Fi drops every evening', description: 'The hostel Wi-Fi disconnects between 9 pm and 11 pm almost every night, which makes it hard to submit assignments.', location: 'A block, rooms 201 to 215', history: [h('pending', 6, 'Student'), h('in_progress', 4, 'Warden, Block A', 'IT team informed, router replacement requested.')] }),
  complaint(3, { studentId: 's1', category: 'electricity', route: 'warden', block: 'A', title: 'Tube light flickering in room', description: 'The tube light in my room flickers constantly and sometimes switches off on its own.', location: 'A-204', history: [h('pending', 14, 'Student'), h('in_progress', 13, 'Warden, Block A', 'Electrician scheduled.'), h('resolved', 11, 'Warden, Block A', 'Choke replaced.')] }),
  complaint(4, { studentId: 's1', category: 'ragging', route: 'dean', block: 'A', hideFromChief: true, title: 'Seniors forcing juniors to run errands at night', description: 'A group of seniors has been calling first-years to their rooms late at night and making them run errands. Several juniors are scared to report it.', history: [h('pending', 2, 'Student')] }),
  complaint(5, { studentId: 's3', category: 'against_warden', route: 'bypass', block: 'A', againstWardenId: 'w_a', title: 'Complaints ignored for weeks', description: 'Maintenance complaints from our floor are not being forwarded. Requests made in person are dismissed without any record.', history: [h('pending', 9, 'Student'), h('in_progress', 7, 'Chief Warden', 'Meeting with Block A warden scheduled.')] }),
  complaint(6, { studentId: 's3', category: 'water', route: 'warden', block: 'A', title: 'No hot water in the mornings', description: 'The geyser on the third floor does not heat water before 8 am.', location: 'A block, 3rd floor', history: [h('pending', 3, 'Student'), h('in_progress', 2, 'Warden, Block A', 'Plumber checking the geyser timer.')] }),
  complaint(7, { studentId: 's2', category: 'mess', route: 'warden', block: 'B', title: 'Undercooked rice at dinner', description: 'Rice served at dinner has been undercooked on most days this week.', location: 'Block B mess', history: [h('pending', 5, 'Student'), h('resolved', 2, 'Warden, Block B', 'Mess contractor warned; quality check added.')] }),
  complaint(8, { studentId: 's6', category: 'ragging', route: 'dean', block: 'B', title: 'Verbal harassment in the common room', description: 'Some students make insulting remarks about first-years in the common room every evening.', history: [h('pending', 8, 'Student'), h('in_progress', 6, 'Dean', 'Anti-ragging committee notified.')] }),
  complaint(9, { studentId: 's6', category: 'pest', route: 'warden', block: 'B', title: 'Cockroaches in pantry', description: 'The floor pantry has cockroaches near the water cooler.', location: 'B block pantry', history: [h('pending', 12, 'Student'), h('in_progress', 11, 'Warden, Block B'), h('resolved', 9, 'Warden, Block B', 'Pest control done.')] }),
  complaint(10, { studentId: 's2', category: 'furniture', route: 'warden', block: 'B', title: 'Broken study chair', description: 'The backrest of my study chair snapped.', location: 'B-112', history: [h('pending', 0, 'Student')] }),
  complaint(11, { studentId: 's4', category: 'electricity', route: 'warden', block: 'C', title: 'Power socket sparking', description: 'The socket next to my bed sparks when I plug in my charger.', location: 'C-105', history: [h('pending', 4, 'Student'), h('in_progress', 4, 'Warden, Block C', 'Socket isolated, electrician tomorrow.')] }),
  complaint(12, { studentId: 's7', category: 'cleanliness', route: 'warden', block: 'C', title: 'Corridor not swept for days', description: 'The third-floor corridor has not been cleaned since last week.', location: 'C block, 3rd floor', history: [h('pending', 10, 'Student')] }),
  complaint(13, { studentId: 's7', category: 'security', route: 'warden', block: 'C', title: 'Back gate left unlocked at night', description: 'The back gate near the parking area is often left open after 11 pm.', location: 'C block back gate', history: [h('pending', 15, 'Student'), h('in_progress', 13, 'Warden, Block C'), h('resolved', 10, 'Warden, Block C', 'Guard posted at back gate.')] }),
  complaint(14, { studentId: 's5', category: 'plumbing', route: 'warden', block: 'D', title: 'Leaking tap wastes water', description: 'The washbasin tap leaks continuously.', location: 'D block, ground floor', history: [h('pending', 7, 'Student'), h('resolved', 5, 'Warden, Block D', 'Washer replaced.')] }),
  complaint(15, { studentId: 's8', category: 'wifi', route: 'warden', block: 'D', title: 'No Wi-Fi signal in room', description: 'There is no Wi-Fi signal at all in D-109.', location: 'D-109', history: [h('pending', 2, 'Student')] }),
  complaint(16, { studentId: 's5', category: 'against_warden', route: 'bypass', block: 'D', againstWardenId: 'w_d', title: 'Rude behaviour during room inspection', description: 'During last week\'s inspection the warden shouted at students in front of visitors.', history: [h('pending', 4, 'Student')] }),
  complaint(17, { studentId: 's8', category: 'washroom', route: 'warden', block: 'D', title: 'Washroom light not working', description: 'The light in the first-floor washroom has been off for two days.', location: 'D block, 1st floor', history: [h('pending', 20, 'Student'), h('in_progress', 19, 'Warden, Block D'), h('resolved', 18, 'Warden, Block D')] }),
  complaint(18, { studentId: 's4', category: 'water', route: 'warden', block: 'C', title: 'Water cooler not cooling', description: 'The water cooler on the second floor dispenses warm water.', location: 'C block, 2nd floor', history: [h('pending', 25, 'Student'), h('resolved', 21, 'Warden, Block C', 'Compressor repaired.')] }),
];

const fines = [
  { id: 'f1', studentId: 's1', issuedById: 'w_a', issuedByRole: 'warden', amount: 500, reason: 'Damaged room furniture (broken cupboard hinge)', complaintId: null, status: 'unpaid', createdAt: ago(3) },
  { id: 'f2', studentId: 's1', issuedById: 'w_a', issuedByRole: 'warden', amount: 200, reason: 'Late return after hostel curfew', complaintId: null, status: 'paid', createdAt: ago(18), paidAt: ago(17), payment: { paymentId: 'pay_DEMO8fK2aQ1x', orderId: 'order_DEMO3Lm9', receiptNo: 'RCPT-24017' } },
  { id: 'f3', studentId: 's3', issuedById: 'w_a', issuedByRole: 'warden', amount: 300, reason: 'Using an electric heater in the room', complaintId: null, status: 'unpaid', createdAt: ago(5) },
  { id: 'f4', studentId: 's5', issuedById: 'w_d', issuedByRole: 'warden', amount: 150, reason: 'Leaving common-room AC running overnight', complaintId: null, status: 'paid', createdAt: ago(12), paidAt: ago(10), payment: { paymentId: 'pay_DEMO1Rt5bN7c', orderId: 'order_DEMO9Qa2', receiptNo: 'RCPT-24009' } },
  { id: 'f5', studentId: 's7', issuedById: 'w_c', issuedByRole: 'warden', amount: 400, reason: 'Leaving the back gate unlocked after curfew', complaintId: 'c13', status: 'unpaid', createdAt: ago(9) },
  { id: 'f6', studentId: 's2', issuedById: 'cw_1', issuedByRole: 'chief', amount: 250, reason: 'Wasting food in the mess repeatedly', complaintId: null, status: 'unpaid', createdAt: ago(1) },
];

const emails = [
  { id: 'e1', to: 's1', kind: 'status', subject: 'HC-1002 is now In Progress', body: 'Your complaint "Wi-Fi drops every evening" was moved to In Progress by Warden, Block A.\n\nNote: IT team informed, router replacement requested.', at: ago(4), read: false },
  { id: 'e2', to: 's1', kind: 'fine', subject: 'Fine issued: ₹500', body: 'A fine of ₹500 has been issued by Warden, Block A.\n\nReason: Damaged room furniture (broken cupboard hinge)\n\nYou can pay it from the Fines page.', at: ago(3), read: false },
  { id: 'e3', to: 's1', kind: 'status', subject: 'HC-1003 is now Resolved', body: 'Your complaint "Tube light flickering in room" was marked Resolved by Warden, Block A.\n\nNote: Choke replaced.', at: ago(11), read: true },
  { id: 'e4', to: 's1', kind: 'payment', subject: 'Payment received: ₹200', body: 'We received your payment of ₹200 for "Late return after hostel curfew".\n\nReceipt: RCPT-24017\nPayment ID: pay_DEMO8fK2aQ1x', at: ago(17), read: true },
];

export function createSeed() {
  return { version: 1, users, complaints, fines, emails, nextComplaintNo: complaints.length + 1 };
}
