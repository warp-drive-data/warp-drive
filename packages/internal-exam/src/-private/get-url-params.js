function decodeQueryParam(param) {
  return decodeURIComponent(param.replace(/\+/g, '%20'));
}

/**
 * Parses the url and returns a Map of the query param keys to values.
 *
 * @return {Map<string, string | string[] | boolean>}
 */
export default function getUrlParams() {
  const urlParams = new Map();
  const params = location.search.slice(1).split('&');

  for (let i = 0; i < params.length; i++) {
    if (params[i]) {
      const param = params[i].split('=');
      const name = decodeQueryParam(param[0]);

      // Allow just a key to turn on a flag, e.g., test.html?noglobals
      const value = param.length === 1 || decodeQueryParam(param.slice(1).join('='));
      if (urlParams.has(name)) {
        urlParams.set(name, [].concat(urlParams.get(name), value));
      } else {
        urlParams.set(name, value);
      }
    }
  }

  return urlParams;
}
