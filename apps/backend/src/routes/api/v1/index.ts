import { Hono } from 'hono';
import authRouter from './auths';
import userRouter from './users';
import chatRouter from './chats';
import fileRouter from './files';
import folderRouter from './folders';
import promptRouter from './prompts';
import modelRouter from './models';
import modelPromptRouter from './model-prompts';
import tagRouter from './tags';
import connectionRouter from './connections';
import settingsRouter from './settings';
import proxyRouter from './proxy';
import noteRouter from './notes';
import setupRouter from './setup';
import groupRouter from './groups';

const apiV1 = new Hono();

apiV1.route('/setup', setupRouter);

apiV1.route('/auths', authRouter);
apiV1.route('/users', userRouter);
apiV1.route('/chats', chatRouter);
apiV1.route('/files', fileRouter);
apiV1.route('/folders', folderRouter);
apiV1.route('/prompts', promptRouter);
apiV1.route('/models', modelRouter);
apiV1.route('/model-prompts', modelPromptRouter);
apiV1.route('/tags', tagRouter);
apiV1.route('/connections', connectionRouter);
apiV1.route('/settings', settingsRouter);

apiV1.route('/proxy', proxyRouter);

apiV1.route('/notes', noteRouter);
apiV1.route('/groups', groupRouter);

export default apiV1;
