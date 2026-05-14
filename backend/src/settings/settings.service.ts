import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const DEFAULT_SETTINGS: Record<string, { value: string; type: string }> = {
  site_name: { value: 'MockCEFR', type: 'string' },
  site_logo: { value: '', type: 'string' },
  site_description: {
    value: 'AI-powered mock exam platform',
    type: 'string',
  },
  site_favicon: { value: '', type: 'string' },
  primary_color: { value: '#6366f1', type: 'string' },
  contact_email: { value: '', type: 'string' },
  contact_phone: { value: '', type: 'string' },
  payment_instructions: { value: '', type: 'text' },
  currency: { value: 'UZS', type: 'string' },
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (!(key in map)) {
        map[key] = def.value;
      }
    }
    return map;
  }

  async get(key: string): Promise<string> {
    const setting = await this.prisma.siteSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? DEFAULT_SETTINGS[key]?.value ?? '';
  }

  async getPublic() {
    const all = await this.getAll();
    return {
      siteName: all['site_name'],
      siteLogo: all['site_logo'],
      siteDescription: all['site_description'],
      siteFavicon: all['site_favicon'],
      primaryColor: all['primary_color'],
      contactEmail: all['contact_email'],
      contactPhone: all['contact_phone'],
      currency: all['currency'],
    };
  }

  async upsert(key: string, value: string) {
    const type = DEFAULT_SETTINGS[key]?.type ?? 'string';
    return this.prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, type },
    });
  }

  async bulkUpdate(settings: Record<string, string>) {
    const ops = Object.entries(settings).map(([key, value]) =>
      this.upsert(key, value),
    );
    return Promise.all(ops);
  }
}
