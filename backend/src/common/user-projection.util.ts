/** Never return password hashes or reset tokens from API queries. */
export const USER_PUBLIC_PROJECTION =
  '-password -resetPasswordToken -resetPasswordExpires';
