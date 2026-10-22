import { AppError } from "../errors/AppError.js";

/** Only the explicit queued routes accept caller-assigned UUIDs. */
export function queuedRequestId(id: string | undefined, owner: string | undefined, actor?: {userId: string}) {
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError("A valid X-Client-Request-Id UUID is required", 400);
  }
  if (!owner || owner !== (actor?.userId || "guest")) {
    throw new AppError("Sign in with the account that saved this post", 401);
  }
  return id;
}

/** The existing primary key makes concurrent/repeated delivery atomic. */
export async function queuedCreate<T>(options: {
  id: string | undefined;
  find: (id: string) => Promise<T | null>;
  matches: (item: T) => boolean;
  create: () => Promise<T>;
}): Promise<{item: T; created: boolean}> {
  const reuse = (item: T) => {
    if (!options.matches(item)) throw new AppError("This request ID belongs to a different post", 409);
    return {item, created: false};
  };
  if (options.id) {
    const existing = await options.find(options.id);
    if (existing) return reuse(existing);
  }
  try { return {item: await options.create(), created: true}; }
  catch (error) {
    // Two devices or retries can race between the lookup and insert.
    if (options.id && (error as {code?: string}).code === "P2002") {
      const existing = await options.find(options.id);
      if (existing) return reuse(existing);
    }
    throw error;
  }
}
