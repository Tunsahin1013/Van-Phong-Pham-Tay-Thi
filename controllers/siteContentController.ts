import { Request, Response } from 'express';
import { SiteContentModel } from '../models/SiteContent.ts';
import { defaultSiteContent } from '../data/siteContentDefaults.ts';

export const siteContentController = {
  async get(req: Request, res: Response) {
    try {
      const content = await SiteContentModel.findOne({ key: 'main' }).lean();
      return res.json({ success: true, data: content || defaultSiteContent });
    } catch (error) {
      console.error('Unable to load site content:', error);
      // Keep the storefront usable if the database is temporarily unavailable.
      return res.json({ success: true, data: defaultSiteContent, source: 'fallback' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const allowedFields = [
        'announcementText', 'hotlineLabel', 'hotline', 'brandName', 'brandTagline',
        'heroSlides', 'perks', 'footerAbout', 'footerAddress', 'footerPhone',
        'footerEmail', 'footerCategories',
      ];
      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] = req.body[field];
        }
      }

      const content = await SiteContentModel.findOneAndUpdate(
        { key: 'main' },
        { $set: updates, $setOnInsert: { key: 'main' } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ).lean();

      return res.json({ success: true, message: 'Đã cập nhật nội dung website', data: content });
    } catch (error) {
      console.error('Unable to update site content:', error);
      return res.status(500).json({ success: false, message: 'Không thể cập nhật nội dung website' });
    }
  },
};
