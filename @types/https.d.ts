export type ResponseCodes =
  200| // Success
  201| // Created
  401| // Unauthorized - user authentication failed
  402|
  403| // Forbidden - Session token invalid
  404| // Not found
  405| // [User email verification pending]
  406| // [Validation error, User disabled]
  407| // Recaptcha token invalid
  408| // [User not allowed to login here, User not allowed to preform this action]
  500; // Server error

export interface HttpResponse {
  data: any,
  code: ResponseCodes | number,
  error: any,
}
