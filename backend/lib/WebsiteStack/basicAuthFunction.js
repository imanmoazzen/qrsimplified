/*
  Sourced from: https://www.joshualyman.com/2022/01/add-http-basic-authentication-to-cloudfront-distributions/
  A note for would-be refactorers: No, Cloudfront functions do not support 'let' or 'const'. Weird, I know. 
  Basically it expects ES5 javascript, plus a few ES6 features.
*/

/* eslint no-unused-vars: 0 */
function handler(event) {
  var authHeaders = event.request.headers.authorization;

  // The Base64-encoded Auth string that should be present.
  // It is an encoding of `Basic base64([username]:[password])`
  // The username and password are available here:
  // https://docs.google.com/document/d/1dLCter6RoMj0F4rhQ_YOrm9j_wS11lfLQAvf_dJmAjE/edit
  var expected = "Basic Z3lkczVtaTcwcWkxMGhhanR3MXg4NGl4bGEycjM1Y2I6enl5dGd1djFkOHhibmRqZDdleDZwNG5hMDVqb3M0Y2o=";

  // If an Authorization header is supplied and it's an exact match, pass the
  // request on through to CF/the origin without any modification.
  if (authHeaders && authHeaders.value === expected) {
    return event.request;
  }

  // But if we get here, we must either be missing the auth header or the
  // credentials failed to match what we expected.
  // Request the browser present the Basic Auth dialog.
  var response = {
    statusCode: 401,
    statusDescription: "Unauthorized",
    headers: {
      "www-authenticate": {
        value: 'Basic realm="Please enter staging credentials"',
      },
    },
  };

  return response;
}
