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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var admin = __importStar(require("firebase-admin"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var seed = require("./index");
var cwd = process.cwd();
var readJSONFile = function (name) {
    return JSON.parse(fs.readFileSync(path.join(cwd, name), "utf-8"));
};
// read "firestore-seed" property in package.json
var config = readJSONFile("package.json")['firestore-seed'];
if (config === undefined) {
    console.log("\"firestore-seed\" property must be contains in 'package.json'.");
    process.exit(1);
}
// read configs from package.json.
if (config.credentialPath === undefined) {
    config.credentialPath = path.join(cwd, "firebase-credential.json");
}
if (config.seedDataPath === undefined) {
    config.seedDataPath = "firestore-seed.js";
}
if (config.databaseURL === undefined) {
    console.log("\"databaseURL\" is required parameter.");
    process.exit(1);
}
/*
 * Import seed data.
 */
(function () {
    return __awaiter(this, void 0, void 0, function () {
        var serviceAccount, seedDataPath, seedDataRaw, seedData, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    serviceAccount = readJSONFile(config.credentialPath);
                    seedDataPath = path.join(cwd, config.seedDataPath);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        databaseURL: config.databaseURL
                    });
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require(seedDataPath)); })];
                case 1:
                    seedDataRaw = (_a.sent()).default;
                    if (seedDataRaw instanceof Array) {
                        seedData = seedDataRaw;
                    }
                    else {
                        seedData = [seedDataRaw];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, seed.importCollections(admin, seedData)];
                case 3:
                    _a.sent();
                    console.log("Successfully imported documents.");
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    console.log("Failed to import documents: " + e_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}());
