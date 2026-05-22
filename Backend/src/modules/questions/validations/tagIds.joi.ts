import Joi from "joi";

export const tagsInputSchema = Joi.array()
  .items(
    Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.object({
        id: Joi.string().uuid().required(),
      }).unknown(false),
    ),
  )
  .max(10);

export const tagIdsSchema = Joi.array().items(Joi.string().uuid()).max(10);
