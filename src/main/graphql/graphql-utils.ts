import { AppError, ErrorCode } from "@/src/modules/shared/errors";
import { Logger } from "../config/logger";
import { withUser } from "../elysia/plugins";

export const handleResolver = <T extends (...args: any[]) => Promise<any>>(
	fn: T,
): T => {
	return (async (...args: any[]) => {
		try {
			return await fn(...args);
		} catch (error) {
			const err = error instanceof Error ? error : new Error("Unknown error");
			Logger.error(`[GraphQL Error]: ${err.message}`, { error: err });
			throw err instanceof AppError
				? err
				: new AppError(err.message, 500, ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}) as T;
};

export const makeResolver = <T extends (...args: any[]) => any>(
	fn: T,
	options?: {
		isAdmin?: boolean;
	},
): ReturnType<typeof withUser> => {
	return withUser(handleResolver(fn), options);
};
