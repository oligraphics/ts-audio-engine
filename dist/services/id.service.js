"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdService = void 0;
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
exports.IdService = new (class IdService {
    createRandomId(length = 8) {
        return Array.from({ length })
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join('');
    }
})();
//# sourceMappingURL=id.service.js.map