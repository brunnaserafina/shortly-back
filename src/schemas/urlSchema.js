import joi from "joi";

const regex = new RegExp(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
);

const urlSchema = joi.object({
  url: joi.string().uri().pattern(regex).required(),
});

export default urlSchema;
