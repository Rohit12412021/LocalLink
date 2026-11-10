import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { ProviderEntity } from '../providers/entities/provider.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

const DEMO_PROVIDERS = [
  {
    user: { name: 'Ramesh Kumar', email: 'ramesh.mechanic@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Ramesh Auto Works',
      category: 'Mechanic',
      location: 'Dharuhera, Haryana',
      experience: '8 years',
      about: 'Expert in car servicing, engine repair, and AC recharge. Trusted by 200+ customers in Dharuhera.',
      phone: '9876543210',
      whatsapp: '9876543210',
      rating: 4.8,
      reviewCount: 47,
      price: '₹500 onwards',
      available: true,
      latitude: 28.2050,
      longitude: 76.7950,
    },
    services: [
      { name: 'Car Servicing', price: '₹500', description: 'Full car service including oil change and inspection' },
      { name: 'AC Recharge', price: '₹800', description: 'Car AC gas refill and check' },
      { name: 'Engine Repair', price: '₹1500 onwards', description: 'Diagnose and repair engine issues' },
    ],
  },
  {
    user: { name: 'Sunil Plumber', email: 'sunil.plumber@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Sunil Plumbing Services',
      category: 'Plumber',
      location: 'Rewari, Haryana',
      experience: '5 years',
      about: 'Fast and reliable plumbing services. Available 24/7 for emergency leaks and installations.',
      phone: '9812345678',
      whatsapp: '9812345678',
      rating: 4.6,
      reviewCount: 32,
      price: '₹300 onwards',
      available: true,
      latitude: 28.1970,
      longitude: 76.6150,
    },
    services: [
      { name: 'Pipe Leak Repair', price: '₹300', description: 'Fix leaking pipes quickly' },
      { name: 'Tap Installation', price: '₹200', description: 'Install new taps and fittings' },
      { name: 'Bathroom Fitting', price: '₹1200', description: 'Complete bathroom plumbing setup' },
    ],
  },
  {
    user: { name: 'Vijay Electrician', email: 'vijay.electric@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Vijay Electrical Solutions',
      category: 'Electrician',
      location: 'Dharuhera, Haryana',
      experience: '10 years',
      about: 'Licensed electrician for home and commercial wiring, fan installation, and inverter setup.',
      phone: '9988776655',
      whatsapp: '9988776655',
      rating: 4.9,
      reviewCount: 61,
      price: '₹400 onwards',
      available: true,
      latitude: 28.2100,
      longitude: 76.8000,
    },
    services: [
      { name: 'Fan Installation', price: '₹400', description: 'Install ceiling and table fans' },
      { name: 'Wiring Repair', price: '₹600', description: 'Fix faulty wiring and switches' },
      { name: 'Inverter Setup', price: '₹1000', description: 'Install and configure home inverter' },
    ],
  },
  {
    user: { name: 'Priya Cleaning', email: 'priya.cleaning@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Priya Home Care',
      category: 'Cleaning',
      location: 'Manesar, Haryana',
      experience: '3 years',
      about: 'Professional home cleaning services. Deep cleaning, sofa cleaning, and kitchen cleaning available.',
      phone: '9870001234',
      whatsapp: '9870001234',
      rating: 4.7,
      reviewCount: 28,
      price: '₹600 onwards',
      available: false,
      latitude: 28.3560,
      longitude: 76.9380,
    },
    services: [
      { name: 'Home Deep Clean', price: '₹600', description: 'Complete deep cleaning of your home' },
      { name: 'Kitchen Cleaning', price: '₹400', description: 'Deep clean kitchen and appliances' },
      { name: 'Sofa Cleaning', price: '₹300 per seat', description: 'Professional sofa shampooing' },
    ],
  },
  {
    user: { name: 'Deepak Painter', email: 'deepak.painter@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Deepak Painting Works',
      category: 'Painter',
      location: 'Bhiwadi, Rajasthan',
      experience: '7 years',
      about: 'Interior and exterior painting at affordable rates. Texture, waterproofing, and POP work also available.',
      phone: '9765432100',
      whatsapp: '9765432100',
      rating: 4.5,
      reviewCount: 19,
      price: '₹15 per sq ft',
      available: true,
      latitude: 28.2000,
      longitude: 76.8570,
    },
    services: [
      { name: 'Interior Painting', price: '₹15 per sq ft', description: 'Interior wall painting with premium paint' },
      { name: 'Exterior Painting', price: '₹18 per sq ft', description: 'Weather-resistant exterior painting' },
      { name: 'POP Work', price: '₹800 onwards', description: 'Plaster of Paris ceiling and wall work' },
    ],
  },
  {
    user: { name: 'Arjun Carpenter', email: 'arjun.carpenter@demo.locallink', password: 'Demo@12345' },
    provider: {
      name: 'Arjun Wood Craft',
      category: 'Carpenter',
      location: 'Dharuhera, Haryana',
      experience: '12 years',
      about: 'Custom furniture, door repair, and modular kitchen work. Quality craftsmanship guaranteed.',
      phone: '9871234560',
      whatsapp: '9871234560',
      rating: 4.8,
      reviewCount: 35,
      price: '₹700 onwards',
      available: true,
      latitude: 28.2030,
      longitude: 76.7920,
    },
    services: [
      { name: 'Door Repair', price: '₹700', description: 'Fix stuck or broken doors and hinges' },
      { name: 'Custom Furniture', price: '₹5000 onwards', description: 'Made-to-order wooden furniture' },
      { name: 'Modular Kitchen', price: '₹20000 onwards', description: 'Complete modular kitchen installation' },
    ],
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DEMO !== 'true') {
      this.logger.log(
        'SEED_DEMO is off — users & providers register with their own email.',
      );
      return;
    }

    const count = await this.providersRepo.count();
    if (count > 0) {
      this.logger.log(`SEED_DEMO: Database already has ${count} providers — skipping seed.`);
      return;
    }

    this.logger.log('SEED_DEMO: Seeding demo providers...');

    for (const data of DEMO_PROVIDERS) {
      // Create user
      const passwordHash = await bcrypt.hash(data.user.password, 10);
      const user = this.usersRepo.create({
        name: data.user.name,
        email: data.user.email,
        passwordHash,
        role: UserRole.Provider,
        emailVerified: true, // demo accounts are pre-verified
        authMethod: 'password',
      });
      await this.usersRepo.save(user);

      // Create provider profile
      const provider = this.providersRepo.create({
        ...data.provider,
        distance: null,
        gallery: [],
        userId: user.id,
        services: [],
      });
      await this.providersRepo.save(provider);

      // Create services
      for (const svc of data.services) {
        const service = this.servicesRepo.create({
          ...svc,
          providerId: provider.id,
        });
        await this.servicesRepo.save(service);
      }

      this.logger.log(`SEED_DEMO: Created provider "${data.provider.name}"`);
    }

    this.logger.log(`SEED_DEMO: Seeded ${DEMO_PROVIDERS.length} providers successfully.`);
  }
}
