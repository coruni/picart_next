/**
 * 本地存储工具
 */

export class Storage {
  private prefix: string;

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

  /**
   * 获取完整的key
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置存储
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error("Storage set error:", error);
    }
  }

  /**
   * 获取存储
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue ?? null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error("Storage get error:", error);
      return defaultValue ?? null;
    }
  }

  /**
   * 删除存储
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error("Storage remove error:", error);
    }
  }

  /**
   * 清空所有存储
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Storage clear error:", error);
    }
  }

  /**
   * 检查key是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}

// 默认实例
export const storage = new Storage();

/**
 * Session Storage 工具
 */
export class SessionStorage {
  private prefix: string;

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error("SessionStorage set error:", error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue ?? null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error("SessionStorage get error:", error);
      return defaultValue ?? null;
    }
  }

  remove(key: string): void {
    try {
      sessionStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error("SessionStorage remove error:", error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("SessionStorage clear error:", error);
    }
  }

  has(key: string): boolean {
    return sessionStorage.getItem(this.getKey(key)) !== null;
  }
}

export const sessionStore = new SessionStorage();
