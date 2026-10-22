import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { AppError } from "../../../core/errors/AppError.js";
import { disablePushDevice, registerPushDevice } from "./device.service.js";

export async function registerDeviceController(req: AuthenticatedRequest, res: Response) {
  // Optional auth must not silently bind an expired staff session to a guest.
  if (req.headers.authorization && !req.user) throw new AppError("Sign in again to register notifications", 401);
  const result = await registerPushDevice(String(req.params.id), req.body, req.user);
  return res.json({success: true, data: result});
}
export async function disableDeviceController(req: AuthenticatedRequest, res: Response) {
  const result = await disablePushDevice(String(req.params.id), req.body);
  return res.json({success: true, data: result});
}
