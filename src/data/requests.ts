/**
 * Legacy mock request list.
 * The live UI now loads bookings from GET /requests (NestJS).
 * Keep this file only as a reference sample for seed data later.
 */
export const requests = [
  {
    id: "REQ-001",
    providerId: "1",
    providerName: "Sharma Auto Repair",
    category: "Mechanic",
    service: "General Service",
    description: "Car needs regular servicing and oil check.",
    date: "31 August 2026",
    time: "10:00 AM",
    location: "Dharuhera, Haryana",
    price: "₹500 onwards",
    status: "Pending",
  },
  {
    id: "REQ-002",
    providerId: "2",
    providerName: "Raj Electrical Services",
    category: "Electrician",
    service: "Fan Installation",
    description: "Need installation of a new ceiling fan.",
    date: "30 August 2026",
    time: "2:00 PM",
    location: "Rewari, Haryana",
    price: "₹300 onwards",
    status: "Accepted",
  },
  {
    id: "REQ-003",
    providerId: "3",
    providerName: "Gupta Plumbing Works",
    category: "Plumber",
    service: "Pipe Repair",
    description: "Water pipe is leaking near the bathroom.",
    date: "25 August 2026",
    time: "11:00 AM",
    location: "Dharuhera, Haryana",
    price: "₹200 onwards",
    status: "Completed",
  },
];