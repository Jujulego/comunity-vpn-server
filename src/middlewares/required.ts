import { Request, Response, NextFunction } from 'express';

import { httpError, ErrorGenerator } from 'errors';

// Types
type Blocks = 'params' | 'query' | 'body';
type Validator = (value: any) => boolean;
type ParameterOptions = { required?: boolean, validator?: Validator };
type Parameters = { [name: string]: boolean | Validator | ParameterOptions };
type Options = { [name: string]: ParameterOptions };

type RequestObject = Request['params'] | Request['query'] | Request['body'];
type RequestOptions = { [block in Blocks]?: Options };
type RequestParameters = { [block in Blocks]?: string[] | Parameters };

// Utils
const isOptions = (obj: any): obj is ParameterOptions => ('required' in obj) && ('validator' in obj);
const isStringArray = (obj: string[] | Parameters): obj is string[] => obj instanceof Array;

function toOptions(val: boolean | Validator | ParameterOptions): ParameterOptions {
  if (isOptions(val)) return val;

  if (typeof val === 'function') {
    return { validator: val };
  }

  return { required: val };
}

function buildOptions(params: string[] | Parameters): Options {
  // String array
  if (isStringArray(params)) {
    return params.reduce<Options>(
      (opts, param) => Object.assign(opts, { [param]: {} }),
      {}
    );
  }

  // Parameters
  return Object.keys(params).reduce<Options>(
    (opts, param) => Object.assign(opts, { [param]: toOptions(params[param]) }),
    {}
  );
}

function error(res: Response, block: Blocks): ErrorGenerator {
  if (block === 'params') {
    return httpError(res).NotFound;
  }

  return httpError(res).BadRequest;
}

function test(obj: RequestObject, opts: Options, error: ErrorGenerator): Response | null {
  const missing: string[] = [];

  for (const name of Object.keys(opts)) {
    const { required = true, validator } = opts[name];
    const value = obj[name];

    if (required && value === undefined) {
      missing.push(value);
    } else if (validator && !validator(value)) {
      return error(`Invalid value for ${name}`);
    }
  }

  if (missing.length > 0) {
    return error(`Missing required parameters: ${missing.join(', ')}`);
  }

  return null;
}

// Middleware
export default function required(parameters: RequestParameters) {
  // Parse options
  const opts: RequestOptions = {};
  if (parameters.params) opts.params = buildOptions(parameters.params);
  if (parameters.query)  opts.query  = buildOptions(parameters.query);
  if (parameters.body)   opts.body   = buildOptions(parameters.body);

  // Middleware
  return function(req: Request, res: Response, next: NextFunction) {
    try {
      let result: Response | null;
      if (opts.params && (result = test(req.params, opts.params, error(res, 'params')))) return result;
      if (opts.query  && (result = test(req.query,  opts.query,  error(res, 'query'))))  return result;
      if (opts.body   && (result = test(req.body,   opts.body,   error(res, 'body'))))   return result;

      next();
    } catch (error) {
      next(error);
    }
  }
}