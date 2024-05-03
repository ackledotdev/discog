import express, { Request, Response } from 'express';
import helmet from 'helmet';

export enum Methods {
	DELETE = 'delete',
	GET = 'get',
	HEAD = 'head',
	PATCH = 'patch',
	POST = 'post',
	PUT = 'put'
}

export interface Route {
	handler: (req: Request, res: Response) => void;
	method: Methods;
	route: string;
}

export function createServer(...routes: Route[]) {
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
