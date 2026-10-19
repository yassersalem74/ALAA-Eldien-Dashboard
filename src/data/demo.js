export const money = value => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
export const users = [
  { id: 'USR-001', name: 'Ahmed Hassan', email: 'ahmed.hassan@example.com', phone: '+20 100 123 4567', city: 'Cairo', joined: 'Oct 18, 2026', orders: 12, status: 'Active' },
  { id: 'USR-002', name: 'Nour Mohamed', email: 'nour.m@example.com', phone: '+20 101 234 5678', city: 'Alexandria', joined: 'Oct 17, 2026', orders: 8, status: 'Active' },
  { id: 'USR-003', name: 'Omar Khaled', email: 'omar.k@example.com', phone: '+20 102 345 6789', city: 'Giza', joined: 'Oct 16, 2026', orders: 5, status: 'Active' },
  { id: 'USR-004', name: 'Sara Adel', email: 'sara.adel@example.com', phone: '+20 103 456 7890', city: 'Cairo', joined: 'Oct 15, 2026', orders: 3, status: 'Inactive' },
  { id: 'USR-005', name: 'Youssef Ali', email: 'youssef.a@example.com', phone: '+20 104 567 8901', city: 'Mansoura', joined: 'Oct 14, 2026', orders: 16, status: 'Active' },
  { id: 'USR-006', name: 'Mariam Mostafa', email: 'mariam.m@example.com', phone: '+20 105 678 9012', city: 'Giza', joined: 'Oct 12, 2026', orders: 7, status: 'Active' },
  { id: 'USR-007', name: 'Kareem Samir', email: 'kareem.s@example.com', phone: '+20 106 789 0123', city: 'Cairo', joined: 'Oct 10, 2026', orders: 0, status: 'Inactive' },
  { id: 'USR-008', name: 'Hana Ibrahim', email: 'hana.i@example.com', phone: '+20 107 890 1234', city: 'Alexandria', joined: 'Oct 09, 2026', orders: 4, status: 'Active' },
  { id: 'USR-009', name: 'Mostafa Tarek', email: 'mostafa.t@example.com', phone: '+20 108 901 2345', city: 'Cairo', joined: 'Oct 08, 2026', orders: 2, status: 'Active' },
]
export const services = [
  { id: 'SRV-001', name: 'Home cleaning', category: 'Home care', description: 'A fresh start for every corner of your home.', price: 350, duration: '2 hours', bookings: 128, icon: 'home', status: 'Active' },
  { id: 'SRV-002', name: 'AC maintenance', category: 'Maintenance', description: 'Keep your space cool and your AC running smoothly.', price: 500, duration: '90 minutes', bookings: 96, icon: 'services', status: 'Active' },
  { id: 'SRV-003', name: 'Plumbing repairs', category: 'Maintenance', description: 'Reliable help for leaks, fittings, and repairs.', price: 250, duration: '1 hour', bookings: 84, icon: 'services', status: 'Active' },
  { id: 'SRV-004', name: 'Electrical services', category: 'Maintenance', description: 'Expert installations and everyday electrical fixes.', price: 300, duration: '1 hour', bookings: 73, icon: 'shield', status: 'Active' },
  { id: 'SRV-005', name: 'Furniture assembly', category: 'Home care', description: 'Your new furniture, ready to feel right at home.', price: 400, duration: '2 hours', bookings: 56, icon: 'box', status: 'Active' },
  { id: 'SRV-006', name: 'Home painting', category: 'Renovation', description: 'Give your favorite spaces a whole new look.', price: 1200, duration: '1 day', bookings: 34, icon: 'home', status: 'Paused' },
]
export const appointments = [
  { id: 'APT-1024', customer: 'Ahmed Hassan', service: 'Home cleaning', provider: 'Clean Home team', date: 'Oct 19, 2026', time: '10:00 AM', amount: 350, status: 'Confirmed' },
  { id: 'APT-1023', customer: 'Nour Mohamed', service: 'AC maintenance', provider: 'Mohamed Ali', date: 'Oct 19, 2026', time: '11:30 AM', amount: 500, status: 'In progress' },
  { id: 'APT-1022', customer: 'Omar Khaled', service: 'Plumbing repairs', provider: 'Hassan Mahmoud', date: 'Oct 19, 2026', time: '01:00 PM', amount: 250, status: 'Pending' },
  { id: 'APT-1021', customer: 'Sara Adel', service: 'Electrical services', provider: 'Khaled Samir', date: 'Oct 20, 2026', time: '09:00 AM', amount: 300, status: 'Confirmed' },
  { id: 'APT-1020', customer: 'Youssef Ali', service: 'Furniture assembly', provider: 'Ahmed Mostafa', date: 'Oct 20, 2026', time: '12:00 PM', amount: 400, status: 'Pending' },
  { id: 'APT-1019', customer: 'Mariam Mostafa', service: 'Home cleaning', provider: 'Clean Home team', date: 'Oct 18, 2026', time: '02:00 PM', amount: 350, status: 'Completed' },
  { id: 'APT-1018', customer: 'Kareem Samir', service: 'AC maintenance', provider: 'Mohamed Ali', date: 'Oct 18, 2026', time: '10:00 AM', amount: 500, status: 'Cancelled' },
]
export const products = [
  { id: 'PRD-001', name: 'Everyday ceramic mug', category: 'Home & living', seller: 'Cairo Home', price: 180, stock: 48, sold: 124, color: '#dce8df', illustration: 'mug', status: 'In stock' },
  { id: 'PRD-002', name: 'Wireless headphones', category: 'Electronics', seller: 'Tech Corner', price: 1450, stock: 24, sold: 86, color: '#e2e5ee', illustration: 'headphones', status: 'In stock' },
  { id: 'PRD-003', name: 'Canvas everyday tote', category: 'Accessories', seller: 'The Local Edit', price: 290, stock: 6, sold: 98, color: '#eee5d5', illustration: 'bag', status: 'Low stock' },
  { id: 'PRD-004', name: 'Minimal desk lamp', category: 'Home & living', seller: 'Cairo Home', price: 650, stock: 32, sold: 67, color: '#e6dfed', illustration: 'lamp', status: 'In stock' },
  { id: 'PRD-005', name: 'Insulated water bottle', category: 'Accessories', seller: 'The Local Edit', price: 320, stock: 0, sold: 142, color: '#dde8ed', illustration: 'bottle', status: 'Out of stock' },
  { id: 'PRD-006', name: 'Portable speaker', category: 'Electronics', seller: 'Tech Corner', price: 890, stock: 4, sold: 53, color: '#e9ded8', illustration: 'speaker', status: 'Low stock' },
]
export const orders = [
  { id: 'ORD-2086', customer: 'Ahmed Hassan', product: 'Wireless headphones', items: 1, date: 'Oct 19, 2026', amount: 1450, payment: 'Paid', status: 'Delivered' },
  { id: 'ORD-2085', customer: 'Nour Mohamed', product: 'Everyday ceramic mug', items: 2, date: 'Oct 19, 2026', amount: 360, payment: 'Paid', status: 'Processing' },
  { id: 'ORD-2084', customer: 'Omar Khaled', product: 'Minimal desk lamp', items: 1, date: 'Oct 18, 2026', amount: 650, payment: 'Paid', status: 'Shipped' },
  { id: 'ORD-2083', customer: 'Sara Adel', product: 'Canvas everyday tote', items: 1, date: 'Oct 18, 2026', amount: 290, payment: 'Pending', status: 'Pending' },
  { id: 'ORD-2082', customer: 'Youssef Ali', product: 'Portable speaker', items: 1, date: 'Oct 18, 2026', amount: 890, payment: 'Paid', status: 'Delivered' },
  { id: 'ORD-2081', customer: 'Mariam Mostafa', product: 'Insulated water bottle', items: 2, date: 'Oct 17, 2026', amount: 640, payment: 'Paid', status: 'Delivered' },
  { id: 'ORD-2080', customer: 'Hana Ibrahim', product: 'Everyday ceramic mug', items: 1, date: 'Oct 17, 2026', amount: 180, payment: 'Refunded', status: 'Cancelled' },
  { id: 'ORD-2079', customer: 'Mostafa Tarek', product: 'Wireless headphones', items: 1, date: 'Oct 16, 2026', amount: 1450, payment: 'Paid', status: 'Shipped' },
]
export const sales = [
  { month: 'May', marketplace: 18000, services: 12000 }, { month: 'Jun', marketplace: 24000, services: 17000 },
  { month: 'Jul', marketplace: 21500, services: 14500 }, { month: 'Aug', marketplace: 32000, services: 21000 },
  { month: 'Sep', marketplace: 28500, services: 24000 }, { month: 'Oct', marketplace: 38650, services: 28800 },
]
