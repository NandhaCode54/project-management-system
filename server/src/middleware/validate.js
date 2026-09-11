const { badRequest } = require('../utils/httpErrors');

const parse = (schema, source) => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw badRequest('Validation failed', details);
  }

  req[source] = result.data;
  next();
};

const validate = {
  body: (schema) => parse(schema, 'body'),
  query: (schema) => parse(schema, 'query'),
  params: (schema) => parse(schema, 'params'),
};

module.exports = validate;