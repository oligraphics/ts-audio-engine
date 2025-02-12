const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const IdService = new (class IdService {
  createRandomId(length = 8) {
    return Array.from({ length })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  }
})();
