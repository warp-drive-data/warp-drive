/**
 * Appends a param and value to a query string.
 *
 * @param {string} query
 * @param {string} param
 * @param {unknown} value
 */
export function addToQuery(query, param, value) {
  if (!value) {
    return query;
  }

  const queryAddParam = query ? query + '&' + param : param;

  return value !== true ? queryAddParam + '=' + value : queryAddParam;
}

/**
 * Adds a query param to a url.
 *
 * @param {string} url
 * @param {string} param
 * @param {unknown} value
 */
export function addToUrl(url, param, value) {
  const urlParts = url.split('?');
  const base = urlParts[0];
  const query = urlParts[1];

  return base + '?' + addToQuery(query, param, value);
}
