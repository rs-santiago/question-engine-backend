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
// test/integration/questions-tenant-isolation.spec.ts
var testing_1 = require("@nestjs/testing");
var request = require("supertest");
var app_module_1 = require("../../src/app.module");
var prisma_service_1 = require("../../src/prisma/prisma.service");
describe('Isolamento Multi-tenant em Questões (Integration Test)', function () {
    var app;
    var prisma;
    var tenantA_Id;
    var tenantB_Id;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleFixture, tenantA, tenantB, subjectA, topicA;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        imports: [app_module_1.AppModule],
                    }).compile()];
                case 1:
                    moduleFixture = _a.sent();
                    app = moduleFixture.createNestApplication();
                    prisma = app.get(prisma_service_1.PrismaService);
                    return [4 /*yield*/, app.init()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.tenant.create({
                            data: { name: 'Curso Alfa', subdomain: 'alfa' },
                        })];
                case 3:
                    tenantA = _a.sent();
                    return [4 /*yield*/, prisma.tenant.create({
                            data: { name: 'Curso Beta', subdomain: 'beta' },
                        })];
                case 4:
                    tenantB = _a.sent();
                    tenantA_Id = tenantA.id;
                    tenantB_Id = tenantB.id;
                    return [4 /*yield*/, prisma.subject.create({
                            data: { tenantId: tenantA_Id, name: 'Direito' },
                        })];
                case 5:
                    subjectA = _a.sent();
                    return [4 /*yield*/, prisma.topic.create({
                            data: { tenantId: tenantA_Id, subjectId: subjectA.id, name: 'Constitucional' },
                        })];
                case 6:
                    topicA = _a.sent();
                    return [4 /*yield*/, prisma.question.create({
                            data: {
                                tenantId: tenantA_Id,
                                topicId: topicA.id,
                                statement: 'Questão Exclusiva do Tenant A',
                                difficulty: 'EASY',
                            },
                        })];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.tenant.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, app.close()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('Tenant B NÃO deve conseguir visualizar a questão do Tenant A', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request(app.getHttpServer())
                        .get('/api/v1/questions')
                        .set('x-tenant-id', tenantB_Id) // Requisição simulando Tenant B
                        .expect(200)];
                case 1:
                    response = _a.sent();
                    // O resultado deve ser uma lista vazia para o Tenant B
                    expect(response.body.data).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('Tenant A deve visualizar com sucesso a sua questão', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request(app.getHttpServer())
                        .get('/api/v1/questions')
                        .set('x-tenant-id', tenantA_Id) // Requisição simulando Tenant A
                        .expect(200)];
                case 1:
                    response = _a.sent();
                    expect(response.body.data).toHaveLength(1);
                    expect(response.body.data[0].statement).toBe('Questão Exclusiva do Tenant A');
                    return [2 /*return*/];
            }
        });
    }); });
});
