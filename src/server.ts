import express from 'express';
import helmet from 'helmet';

export const METHODS = {
	DELETE: 'delete',
	GET: 'get',
	HEAD: 'head',
	PATCH: 'patch',
	POST: 'post',
	PUT: 'put'
} as const;

export function createServer(
	...routes: {
		handler: express.RequestHandler;
		method: (typeof METHODS)[keyof typeof METHODS];
		route: string;
	}[]
) {
	const app = express();
	for (const { handler, method, route } of routes) {
		app[method](route, handler);
	}
	// cors
	app.use(
		helmet({
			crossOriginResourcePolicy: {
				policy: 'same-site'
			}
		})
	);
	return app;
}
