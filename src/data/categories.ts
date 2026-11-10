import {
  Wrench, Zap, Hammer, Car, Smartphone, Snowflake,
  PaintBucket, Bug, BookOpen, Scissors, Camera, Cpu,
  Droplets, Sofa, MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

/** Single source of truth used by BOTH frontend and exported as strings for backend validation */
export const categories: Category[] = [
  { id: "mechanic",        name: "Mechanic",         description: "Vehicle repair and maintenance",      icon: Wrench       },
  { id: "electrician",     name: "Electrician",      description: "Electrical repair and installation",  icon: Zap          },
  { id: "plumber",         name: "Plumber",          description: "Plumbing and water solutions",        icon: Droplets     },
  { id: "carpenter",       name: "Carpenter",        description: "Carpentry and furniture work",        icon: Hammer       },
  { id: "car-repair",      name: "Car Repair",       description: "Car maintenance and repair",          icon: Car          },
  { id: "ac-repair",       name: "AC Repair",        description: "AC installation and repair",          icon: Snowflake    },
  { id: "cleaning",        name: "Cleaning",         description: "Home and office cleaning",            icon: Sofa         },
  { id: "painting",        name: "Painting",         description: "Interior and exterior painting",      icon: PaintBucket  },
  { id: "mobile-repair",   name: "Mobile Repair",    description: "Mobile and device repair",            icon: Smartphone   },
  { id: "appliance-repair",name: "Appliance Repair", description: "Home appliance repair",               icon: Cpu          },
  { id: "pest-control",    name: "Pest Control",     description: "Pest and insect control",             icon: Bug          },
  { id: "home-tutor",      name: "Home Tutor",       description: "Private tutoring and coaching",       icon: BookOpen     },
  { id: "salon-beauty",    name: "Salon & Beauty",   description: "Haircut, makeup and beauty services", icon: Scissors     },
  { id: "photography",     name: "Photography",      description: "Event and product photography",       icon: Camera       },
  { id: "other",           name: "Other",            description: "Any other service",                   icon: MoreHorizontal},
];

/** Plain string names — import this where you need a simple list (backend, forms, selects) */
export const CATEGORY_NAMES: string[] = categories.map(c => c.name);

/** Normalize a category string for comparison (handles capitalization, spacing) */
export function normalizeCategory(cat: string): string {
  return cat.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Find a category by name (case-insensitive) */
export function findCategory(name: string): Category | undefined {
  const n = name.trim().toLowerCase();
  return categories.find(c => c.name.toLowerCase() === n || c.id === n);
}
