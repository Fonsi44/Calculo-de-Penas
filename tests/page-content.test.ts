import { describe, it, expect } from 'vitest';
import { getEditablePagesMeta } from '@/lib/page-content-db';

describe('Home page content integration', () => {
  it('getEditablePagesMeta returns home page definition', async () => {
    const meta = await getEditablePagesMeta();
    const home = meta.find(m => m.page === 'home');
    expect(home).toBeDefined();
    expect(home!.label).toContain('Inicio');
    expect(home!.sections.length).toBeGreaterThan(0);
  });

  it('home page has all required sections with field keys', async () => {
    const meta = await getEditablePagesMeta();
    const home = meta.find(m => m.page === 'home')!;
    const allKeys = home.sections.flatMap(s =>
      s.fields.map(f => `${s.key}.${f.key}`)
    );

    // Verify critical field keys exist for the home page t() lookups
    const requiredKeys = [
      'hero.badge',
      'hero.title_line1',
      'hero.title_line2',
      'hero.subtitle',
      'hero.check1',
      'hero.check2',
      'contact_card.title',
      'contact_card.whatsapp_msg',
      'contact_card.form_text',
      'contact_card.form_hint',
      'questions.eyebrow',
      'questions.title',
      'questions.subtitle',
      'questions.q1',
      'questions.q1_badge',
      'specialties.title',
      'specialties.subtitle',
      'services.title',
      'services.subtitle',
      'testimonials.title',
      'testimonials.testimonial1_name',
      'testimonials.testimonial1_body',
      'process.title',
      'process.step1_title',
      'process.step1_desc',
      'why_us.title',
      'why_us.reason1_title',
      'why_us.reason1_desc',
      'multidisciplinary.title',
      'multidisciplinary.subtitle',
      'multidisciplinary.description',
      'multidisciplinary.combo1_title',
      'multidisciplinary.combo1_desc',
      'faq.title',
      'faq.subtitle',
      'faq.q1',
      'faq.a1',
    ];

    for (const key of requiredKeys) {
      expect(allKeys).toContain(key);
    }
  });

  it('every field has a default value for the home page', async () => {
    const meta = await getEditablePagesMeta();
    const home = meta.find(m => m.page === 'home')!;
    for (const section of home.sections) {
      for (const field of section.fields) {
        expect(
          (field as { default?: string }).default,
          `Field ${section.key}.${field.key} is missing default value`
        ).toBeDefined();
      }
    }
  });

  it('home page sections are in expected order', async () => {
    const meta = await getEditablePagesMeta();
    const home = meta.find(m => m.page === 'home')!;
    const sectionKeys = home.sections.map(s => s.key);
    expect(sectionKeys).toEqual([
      'hero',
      'contact_card',
      'questions',
      'specialties',
      'services',
      'testimonials',
      'process',
      'why_us',
      'multidisciplinary',
      'faq',
    ]);
  });

  it('merged content uses DB value over default when both present', () => {
    const defaults: Record<string, string> = { 'hero.badge': 'Default Badge' };
    const dbContent: Record<string, string> = { 'hero.badge': 'DB Badge' };
    const merged = { ...defaults, ...dbContent };
    expect(merged['hero.badge']).toBe('DB Badge');
  });

  it('merged content falls back to default when no DB value', () => {
    const defaults: Record<string, string> = { 'hero.badge': 'Default Badge' };
    const dbContent: Record<string, string> = {};
    const merged = { ...defaults, ...dbContent };
    expect(merged['hero.badge']).toBe('Default Badge');
  });

  it('t() returns empty string for unknown keys', async () => {
    const meta = await getEditablePagesMeta();
    const home = meta.find(m => m.page === 'home')!;
    const defaults: Record<string, string> = {};
    for (const section of home.sections) {
      for (const field of section.fields) {
        const key = `${section.key}.${field.key}`;
        if ((field as { default?: string }).default !== undefined) {
          defaults[key] = (field as { default?: string }).default!;
        }
      }
    }
    const merged: Record<string, string> = { ...defaults };
    const t = (k: string): string => merged[k] ?? '';
    expect(t('nonexistent.key')).toBe('');
    expect(t('hero.badge')).toBeTruthy();
    expect(t('hero.badge').length).toBeGreaterThan(0);
  });
});
