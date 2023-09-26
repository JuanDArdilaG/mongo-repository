export class ItemNotFoundException extends Error {
  constructor(name: string, key: string, value: string) {
    super(`${name} document with ${key} '${value}' doesn't exists.`);
  }
}
