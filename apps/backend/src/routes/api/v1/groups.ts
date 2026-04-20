import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { groupService } from '../../../services/group.service';
import { authMiddleware, adminMiddleware } from '../../../middleware/auth';

const groupRouter = new Hono();

const createGroupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    permissions: z.record(z.boolean()).optional(),
});

const updateGroupSchema = createGroupSchema.partial();

const addMemberSchema = z.object({
    userId: z.string().min(1),
});

groupRouter.get('/', authMiddleware, adminMiddleware, async (c) => {
    const allGroups = await groupService.getGroups();

    const withCounts = await Promise.all(
        allGroups.map(async (g) => ({
            ...g,
            memberCount: await groupService.getGroupMemberCount(g.id),
        }))
    );

    return c.json(withCounts);
});

groupRouter.post('/', authMiddleware, adminMiddleware, zValidator('json', createGroupSchema), async (c) => {
    const data = c.req.valid('json');
    const group = await groupService.createGroup(data);
    return c.json(group, 201);
});

groupRouter.get('/:id', authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param('id');
    const group = await groupService.getGroupById(id);
    return c.json(group);
});

groupRouter.put('/:id', authMiddleware, adminMiddleware, zValidator('json', updateGroupSchema), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const group = await groupService.updateGroup(id, data);
    return c.json(group);
});

groupRouter.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param('id');
    await groupService.deleteGroup(id);
    return c.json({ message: 'Group deleted' });
});

groupRouter.get('/memberships', authMiddleware, adminMiddleware, async (c) => {
    const memberships = await groupService.getAllGroupMemberships();
    return c.json(memberships);
});

groupRouter.get('/users/:userId', authMiddleware, adminMiddleware, async (c) => {
    const userId = c.req.param('userId');
    const userGroups = await groupService.getUserGroups(userId);
    return c.json(userGroups);
});

groupRouter.get('/:id/members', authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param('id');
    const members = await groupService.getGroupMembers(id);
    return c.json(members);
});

groupRouter.post('/:id/members', authMiddleware, adminMiddleware, zValidator('json', addMemberSchema), async (c) => {
    const id = c.req.param('id');
    const { userId } = c.req.valid('json');
    await groupService.addMember(id, userId);
    return c.json({ message: 'Member added' });
});

groupRouter.delete('/:id/members/:userId', authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param('id');
    const userId = c.req.param('userId');
    await groupService.removeMember(id, userId);
    return c.json({ message: 'Member removed' });
});

export default groupRouter;
