import { createHash, timingSafeEqual } from "node:crypto";
import Joi from "joi";
import prisma from "../../../config/db.js";
import { AppError } from "../../../core/errors/AppError.js";
import type { JwtPayload } from "../../../shared/types/types.js";

const identitySchema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
  secret: Joi.string().pattern(/^[a-f0-9-]{72}$/i).required(),
  version: Joi.number().integer().min(1).max(2147483647).required(),
}).required();
const registrationSchema = Joi.object({
  secret: identitySchema.extract("secret"),
  version: identitySchema.extract("version"),
  expoPushToken: Joi.string().pattern(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/).required(),
  userId: Joi.alternatives(Joi.string().uuid(), Joi.valid("guest")).required(),
  language: Joi.string().valid("en", "am").default("en"),
}).required();

function validate<T>(schema: Joi.Schema, value: unknown): T {
  const result = schema.validate(value, { abortEarly: true });
  if (result.error) throw new AppError("Invalid device registration", 400);
  return result.value as T;
}
function secretHash(secret: string) { return createHash("sha256").update(secret).digest("hex"); }
function verifySecret(stored: string, incoming: string) {
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(incoming, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new AppError("Device identity does not match", 403);
}

export async function registerPushDevice(id: string, body: unknown, actor?: JwtPayload) {
  const input = validate<{secret: string; version: number; expoPushToken: string; userId: string; language: string}>(registrationSchema, body);
  validate(identitySchema, {id, secret: input.secret, version: input.version});
  if (input.userId !== (actor?.userId || "guest")) throw new AppError("Sign in with the current account", 401);
  if (actor) {
    const user = await prisma.user.findFirst({where: {id: actor.userId, isActive: true, deletedAt: null}, select: {id: true}});
    if (!user) throw new AppError("This account is inactive", 403);
  }
  const hash = secretHash(input.secret);
  try {
    await prisma.$transaction(async tx => {
      const existing = await tx.pushDevice.findUnique({where: {id}});
      if (existing) {
        verifySecret(existing.secretHash, hash);
        if (input.version < existing.bindingVersion) throw new AppError("Device registration was superseded", 409);
        if (input.version === existing.bindingVersion && (!existing.isEnabled || existing.userId !== (actor?.userId || null) || existing.expoPushToken !== input.expoPushToken)) {
          throw new AppError("Device registration was superseded", 409);
        }
      }
      // Reinstallation may reuse an Expo token. Only one installation can own it.
      await tx.pushDevice.updateMany({
        where: {expoPushToken: input.expoPushToken, id: {not: id}},
        data: {expoPushToken: null, isEnabled: false, bindingVersion: {increment: 1}},
      });
      const data = {userId: actor?.userId || null, expoPushToken: input.expoPushToken,
        language: input.language, bindingVersion: input.version, isEnabled: true, lastSeenAt: new Date()};
      if (existing) {
        const updated = await tx.pushDevice.updateMany({where: {id, secretHash: hash, bindingVersion: {lte: input.version}}, data});
        if (!updated.count) throw new AppError("Device registration was superseded", 409);
      } else {
        await tx.pushDevice.create({data: {id, secretHash: hash, ...data}});
      }
    });
  } catch (error) {
    if ((error as {code?: string}).code === "P2002") throw new AppError("Device registration changed. Retry registration.", 409);
    throw error;
  }
  return {registered: true};
}

export async function disablePushDevice(id: string, body: unknown) {
  const {secret, version} = validate<{id: string; secret: string; version: number}>(identitySchema, {...(body as object), id});
  const hash = secretHash(secret);
  await prisma.$transaction(async tx => {
    const existing = await tx.pushDevice.findUnique({where: {id}});
    if (existing) {
      verifySecret(existing.secretHash, hash);
      await tx.pushDevice.updateMany({where: {id, secretHash: hash, bindingVersion: {lte: version}},
        data: {isEnabled: false, expoPushToken: null, userId: null, bindingVersion: version}});
    } else {
      // A tombstone also blocks an older registration still in flight at logout.
      await tx.pushDevice.create({data: {id, secretHash: hash, bindingVersion: version, isEnabled: false}});
    }
  });
  return {registered: false};
}
