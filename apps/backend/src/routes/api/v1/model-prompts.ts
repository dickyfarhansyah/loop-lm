import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { modelPromptService } from '../../../services/model-prompt.service';
import { modelService } from '../../../services/model.service';
import { authMiddleware } from '../../../middleware/auth';

const modelPromptRouter = new Hono();

modelPromptRouter.get('/summary', authMiddleware, async (c) => {
    const user = c.get('user');
    const summary = await modelPromptService.getModelPromptsSummary(user.id);
    return c.json(summary);
});

const createModelPromptSchema = z.object({
    name: z.string().min(1).max(100),
    prompt: z.string().min(1).max(10000),
    enabled: z.boolean().optional(),
    isDefault: z.boolean().optional(),
});

const updateModelPromptSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    prompt: z.string().min(1).max(10000).optional(),
    enabled: z.boolean().optional(),
    isDefault: z.boolean().optional(),
});

modelPromptRouter.get('/models/:modelId/prompts', authMiddleware, async (c) => {
    const user = c.get('user');
    const modelId = decodeURIComponent(c.req.param('modelId'));

    
    const model = await modelService.getOrCreateModel(modelId, user.id);

    const prompts = await modelPromptService.getModelPrompts(model.id, user.id);
    return c.json(prompts);
});

modelPromptRouter.post(
    '/models/:modelId/prompts',
    authMiddleware,
    zValidator('json', createModelPromptSchema),
    async (c) => {
        const user = c.get('user');
        const modelId = decodeURIComponent(c.req.param('modelId'));
        const data = c.req.valid('json');

        
        const model = await modelService.getOrCreateModel(modelId, user.id);

        const prompt = await modelPromptService.createModelPrompt(model.id, user.id, data);
        return c.json(prompt, 201);
    }
);

modelPromptRouter.get('/prompts/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const prompt = await modelPromptService.getModelPromptById(id, user.id);
    return c.json(prompt);
});

modelPromptRouter.put(
    '/prompts/:id',
    authMiddleware,
    zValidator('json', updateModelPromptSchema),
    async (c) => {
        const user = c.get('user');
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const prompt = await modelPromptService.updateModelPrompt(id, user.id, data);
        return c.json(prompt);
    }
);

modelPromptRouter.delete('/prompts/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    await modelPromptService.deleteModelPrompt(id, user.id);
    return c.json({ message: 'Prompt deleted successfully' });
});

modelPromptRouter.post('/prompts/:id/set-default', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const prompt = await modelPromptService.setDefaultPrompt(id, user.id);
    return c.json(prompt);
});

export default modelPromptRouter;
