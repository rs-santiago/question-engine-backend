"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/common/guards/tenant.guard.spec.ts
var tenant_guard_1 = require("./tenant.guard");
var common_1 = require("@nestjs/common");
describe('TenantGuard (Unit Test)', function () {
    var guard;
    var prismaServiceMock;
    beforeEach(function () {
        prismaServiceMock = {
            tenant: {
                findUnique: jest.fn(),
            },
        };
        guard = new tenant_guard_1.TenantGuard(prismaServiceMock);
    });
    it('deve lançar UnauthorizedException se nenhum x-tenant-id for enviado', function () { return __awaiter(void 0, void 0, void 0, function () {
        var contextMock;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contextMock = {
                        switchToHttp: function () { return ({
                            getRequest: function () { return ({ headers: {} }); },
                        }); },
                    };
                    return [4 /*yield*/, expect(guard.canActivate(contextMock)).rejects.toThrow(common_1.UnauthorizedException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deve lançar ForbiddenException se o Tenant estiver SUSPENDED', function () { return __awaiter(void 0, void 0, void 0, function () {
        var contextMock;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prismaServiceMock.tenant.findUnique.mockResolvedValue({
                        id: 'tenant-123',
                        status: 'SUSPENDED',
                    });
                    contextMock = {
                        switchToHttp: function () { return ({
                            getRequest: function () { return ({ headers: { 'x-tenant-id': 'tenant-123' } }); },
                        }); },
                    };
                    return [4 /*yield*/, expect(guard.canActivate(contextMock)).rejects.toThrow(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deve permitir acesso e injetar o tenantId na requisição se o Tenant estiver ACTIVE', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requestObj, contextMock, canActivate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prismaServiceMock.tenant.findUnique.mockResolvedValue({
                        id: 'tenant-valid-uuid',
                        status: 'ACTIVE',
                    });
                    requestObj = { headers: { 'x-tenant-id': 'tenant-valid-uuid' } };
                    contextMock = {
                        switchToHttp: function () { return ({
                            getRequest: function () { return requestObj; },
                        }); },
                    };
                    return [4 /*yield*/, guard.canActivate(contextMock)];
                case 1:
                    canActivate = _a.sent();
                    expect(canActivate).toBe(true);
                    expect(requestObj.tenantId).toBe('tenant-valid-uuid');
                    return [2 /*return*/];
            }
        });
    }); });
});
