/**
 * Legacy mock provider list.
 * The live UI now loads providers from GET /providers (NestJS).
 * Keep this file only as a reference sample for seed data later.
 */
export const providers = [
  {
    id: "1",
    name: "Sharma Auto Repair",
    category: "Mechanic",
    rating: 4.8,
    reviewCount: 126,
    distance: "1.2 km",
    price: "₹200 onwards",
    available: true,
    location: "Dharuhera, Haryana",

    phone: "+919876543210",
    whatsapp: "+919876543210",

    experience: "8 years",

    about:
      "Sharma Auto Repair provides professional two-wheeler and four-wheeler repair services. We offer reliable service, experienced mechanics and transparent pricing.",

    services: [
      {
        name: "General Service",
        price: "₹500 onwards",
      },
      {
        name: "Engine Repair",
        price: "₹1,000 onwards",
      },
      {
        name: "Emergency Roadside Help",
        price: "₹300 onwards",
      },
    ],
  },

  {
    id: "2",
    name: "Raj Electrical Services",
    category: "Electrician",
    rating: 4.7,
    reviewCount: 89,
    distance: "2.4 km",
    price: "₹250 onwards",
    available: true,
    location: "Rewari, Haryana",

    phone: "+919876543211",
    whatsapp: "+919876543211",

    experience: "6 years",

    about:
      "Professional electrical repair and installation services for homes and businesses.",

    services: [
      {
        name: "Electrical Repair",
        price: "₹250 onwards",
      },
      {
        name: "Fan Installation",
        price: "₹300 onwards",
      },
      {
        name: "Home Wiring",
        price: "₹1,500 onwards",
      },
    ],
  },

  {
    id: "3",
    name: "Gupta Plumbing Works",
    category: "Plumber",
    rating: 4.6,
    reviewCount: 73,
    distance: "3.1 km",
    price: "₹150 onwards",
    available: false,
    location: "Dharuhera, Haryana",

    phone: "+919876543212",
    whatsapp: "+919876543212",

    experience: "10 years",

    about:
      "Experienced plumbing services for residential and commercial customers.",

    services: [
      {
        name: "Pipe Repair",
        price: "₹200 onwards",
      },
      {
        name: "Bathroom Fitting",
        price: "₹500 onwards",
      },
      {
        name: "Water Tank Repair",
        price: "₹400 onwards",
      },
    ],
  },
];