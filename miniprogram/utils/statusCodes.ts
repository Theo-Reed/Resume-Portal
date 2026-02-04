export enum StatusCode {
  SUCCESS = 0,
  
  // Client errors (40000+)
  BAD_REQUEST = 40000,
  INVALID_PARAMS = 40001,
  
  // Auth errors (40100+)
  UNAUTHORIZED = 40101, // Missing token
  INVALID_TOKEN = 40102, // Invalid/Expired token
  USER_NOT_FOUND = 40103, // For loginByOpenid: user doesn't exist (need register)
  
  // Permission errors (40300+)
  FORBIDDEN = 40301,
  
  // Conflict errors (40900+)
  USER_EXISTS = 40901,
  
  // Server errors (50000+)
  INTERNAL_ERROR = 50000,
}
