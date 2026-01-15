/**
 * 数据验证工具
 */

/**
 * 验证邮箱
 */
export function isEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 验证手机号（中国）
 */
export function isPhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

/**
 * 验证URL
 */
export function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证身份证号（中国）
 */
export function isIdCard(idCard: string): boolean {
  const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return regex.test(idCard);
}

/**
 * 验证密码强度
 * @returns 0-4 表示强度等级
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
}

/**
 * 验证是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * 验证数字范围
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * 验证字符串长度
 */
export function isLengthValid(
  str: string,
  min: number,
  max?: number
): boolean {
  const len = str.length;
  if (max === undefined) return len >= min;
  return len >= min && len <= max;
}

/**
 * 验证是否为数字
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * 验证是否为整数
 */
export function isInteger(value: any): boolean {
  return Number.isInteger(Number(value));
}

/**
 * 验证是否为正数
 */
export function isPositive(value: number): boolean {
  return value > 0;
}

/**
 * 验证银行卡号
 */
export function isBankCard(cardNumber: string): boolean {
  const regex = /^[1-9]\d{9,29}$/;
  return regex.test(cardNumber);
}

/**
 * 验证中文字符
 */
export function isChinese(str: string): boolean {
  const regex = /^[\u4e00-\u9fa5]+$/;
  return regex.test(str);
}

/**
 * 验证IP地址
 */
export function isIP(ip: string): boolean {
  const regex =
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}
