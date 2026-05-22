import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateNotificationDto } from "../dto/createNotification.dto.js";
import type { UpdateNotificationDto } from "../dto/updateNotification.dto.js";
import type { ListNotificationsQuery } from "../types/notification.types.js";
import {
  createNotificationSchema,
  listNotificationsSchema,
  updateNotificationSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const notificationValidationService = {
  validateCreate(body: unknown): CreateNotificationDto {
    const { error, value } = createNotificationSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateNotificationDto;
  },

  validateUpdate(body: unknown): UpdateNotificationDto {
    const { error, value } = updateNotificationSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateNotificationDto;
  },

  validateListQuery(query: unknown): ListNotificationsQuery {
    const { error, value } = listNotificationsSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListNotificationsQuery;
  },
};
