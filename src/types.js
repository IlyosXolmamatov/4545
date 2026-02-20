// ============ ENUMS ============
export const Role = {
  Admin: 1,
  Waiter: 2,
  Cashier: 3
};

// ============ HELPER FUNCTIONS ============
export const getRoleName = (roleValue) => {
  if (roleValue === Role.Admin) return 'Admin';
  if (roleValue === Role.Waiter) return 'Ofitsant';
  if (roleValue === Role.Cashier) return 'Kassa';
  return 'Noma\'lum';
};

// Bu faylda type'lar JSDoc orqali yozilgan
// React.js oddiy JavaScript bilan ishlaydi

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} access_token
 */

/**
 * @typedef {Object} JwtPayload
 * @property {string} sub
 * @property {string} role
 * @property {string[]} permission
 * @property {number} exp
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} name
 * @property {string|null} username
 * @property {number} role
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} UserCreateDto
 * @property {string} name
 * @property {string} username
 * @property {string} password
 * @property {number} role
 */

/**
 * @typedef {Object} UserUpdateDto
 * @property {string} id
 * @property {string} name
 * @property {number} role
 * @property {boolean} isActive
 */
