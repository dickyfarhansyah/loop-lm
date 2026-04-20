import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { settingsService } from '../../../services/settings.service';
import { authMiddleware, adminMiddleware } from '../../../middleware/auth';

const settingsRouter = new Hono();

const updateSettingsSchema = z.record(z.any());

settingsRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
  const allSettings = await settingsService.getAllSettings();
  return c.json(allSettings);
});

settingsRouter.get('/categories', authMiddleware, adminMiddleware, async (c) => {
  const categories = settingsService.getCategories();
  return c.json({ categories });
});

settingsRouter.get('/:category', async (c) => {
  const category = c.req.param('category');
  const categorySettings = await settingsService.getSettingsByCategory(category);
  return c.json(categorySettings);
});

settingsRouter.put('/:category', authMiddleware, adminMiddleware, zValidator('json', updateSettingsSchema), async (c) => {
  const category = c.req.param('category');
  const data = c.req.valid('json');
  const updated = await settingsService.updateCategorySettings(category, data);
  return c.json(updated);
});

settingsRouter.delete('/:category', authMiddleware, adminMiddleware, async (c) => {
  const category = c.req.param('category');
  await settingsService.resetCategory(category);
  return c.json({ message: `Settings for ${category} reset to defaults` });
});

settingsRouter.get('/:category/:key', authMiddleware, adminMiddleware, async (c) => {
  const category = c.req.param('category');
  const key = c.req.param('key');
  const value = await settingsService.getSetting(category, key);
  return c.json({ category, key, value });
});

settingsRouter.put('/:category/:key', authMiddleware, adminMiddleware, zValidator('json', z.object({ value: z.any() })), async (c) => {
  const category = c.req.param('category');
  const key = c.req.param('key');
  const { value } = c.req.valid('json');
  const setting = await settingsService.setSetting(category, key, value);
  return c.json(setting);
});

settingsRouter.delete('/:category/:key', authMiddleware, adminMiddleware, async (c) => {
  const category = c.req.param('category');
  const key = c.req.param('key');
  await settingsService.deleteSetting(category, key);
  return c.json({ message: `Setting ${category}.${key} reset to default` });
});

export default settingsRouter;
