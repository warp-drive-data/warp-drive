import type { Link, Meta } from './json-api-raw.ts';

/**
 * Represents a single error in the `errors` member of a {json:api} document.
 *
 * [{json:api} Spec](https://jsonapi.org/format/#error-objects)
 *
 * @example
 * ```json
 * {
 *   "status": "422",
 *   "source": { "pointer": "/data/attributes/name" },
 *   "title": "Invalid Attribute",
 *   "detail": "name cannot be blank"
 * }
 * ```
 */
export interface ApiError {
  /**
   * a unique identifier for this particular occurrence of the problem
   */
  id?: string;
  /**
   * a short, human-readable summary of the problem that should not
   * change from occurrence to occurrence of the problem
   */
  title?: string;
  /**
   * a human-readable explanation specific to this occurrence of the problem
   */
  detail?: string;
  /**
   * links related to the error
   */
  links?: {
    /**
     * a link that leads to further details about this particular occurrence of the problem
     */
    about?: Link;
    /**
     * a link that identifies the type of error that this particular error is an instance of
     */
    type?: Link;
  };
  /**
   * the HTTP status code applicable to this problem, expressed as a string value
   */
  status?: string;
  /**
   * an application-specific error code, expressed as a string value
   */
  code?: string;
  /**
   * an object containing references to the primary source of the error
   */
  source?: {
    /**
     * a JSON Pointer to the value in the request document that caused the error
     */
    pointer: string;
    /**
     * the URI query parameter that caused the error
     */
    parameter?: string;
    /**
     * the name of a single request header which caused the error
     */
    header?: string;
  };
  /**
   * non-standard meta-information about the error
   */
  meta?: Meta;
}
