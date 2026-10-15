import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteContent extends Document {
  key: string;
  announcementText: string;
  hotlineLabel: string;
  hotline: string;
  brandName: string;
  brandTagline: string;
  heroSlides: Array<Record<string, unknown>>;
  perks: Array<Record<string, unknown>>;
  footerAbout: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerCategories: Array<Record<string, unknown>>;
}

const HeroSlideSchema = new Schema({
  id: { type: String, required: true },
  badge: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  ctaLink: { type: String, default: '/products' },
  secondaryCtaText: { type: String, default: '' },
  secondaryCtaLink: { type: String, default: '/products' },
  image: { type: String, default: '' },
  accentColor: { type: String, default: '#2563eb' },
}, { _id: false });

const PerkSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Award' },
}, { _id: false });

const FooterCategorySchema = new Schema({
  label: { type: String, required: true },
  categoryId: { type: String, required: true },
}, { _id: false });

const SiteContentSchema = new Schema({
  key: { type: String, unique: true, default: 'main' },
  announcementText: { type: String, default: '' },
  hotlineLabel: { type: String, default: 'Hotline' },
  hotline: { type: String, default: '' },
  brandName: { type: String, default: 'Stationery Shop' },
  brandTagline: { type: String, default: '' },
  heroSlides: { type: [HeroSlideSchema], default: [] },
  perks: { type: [PerkSchema], default: [] },
  footerAbout: { type: String, default: '' },
  footerAddress: { type: String, default: '' },
  footerPhone: { type: String, default: '' },
  footerEmail: { type: String, default: '' },
  footerCategories: { type: [FooterCategorySchema], default: [] },
}, { timestamps: true, collection: 'sitecontents' });

export const SiteContentModel: Model<ISiteContent> =
  (mongoose.models.SiteContent as Model<ISiteContent>) || mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);
