export function isObject(argument: any): argument is object {
  if (typeof argument !== 'object') return false;
  if (Array.isArray(argument)) return false;

  return true;
}

export function objectHasKey<T extends object, K extends keyof T>(param: T, key: K): key is K {
  if (!isObject(param)) return false;
  if (Object.keys(param).includes(key.toString())) return true

  return false
}