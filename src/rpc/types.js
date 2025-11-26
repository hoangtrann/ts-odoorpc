"use strict";
/**
 * JSON-RPC 2.0 types for communication with Odoo.
 *
 * This module defines the request and response types for the JSON-RPC 2.0 protocol
 * used by Odoo's web API.
 *
 * @see https://www.jsonrpc.org/specification
 * @see https://www.odoo.com/documentation/16.0/developer/reference/external_api.html
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OdooEndpoint = void 0;
/**
 * Standard Odoo RPC endpoints.
 */
var OdooEndpoint;
(function (OdooEndpoint) {
    /** Authentication endpoint */
    OdooEndpoint["AUTHENTICATE"] = "/web/session/authenticate";
    /** Dataset call endpoint (for call_kw) */
    OdooEndpoint["CALL_KW"] = "/web/dataset/call_kw";
    /** Session information endpoint */
    OdooEndpoint["SESSION_INFO"] = "/web/session/get_session_info";
    /** Session destruction endpoint */
    OdooEndpoint["DESTROY"] = "/web/session/destroy";
    /** Database list endpoint */
    OdooEndpoint["DB_LIST"] = "/web/database/list";
    /** Version info endpoint */
    OdooEndpoint["VERSION_INFO"] = "/web/webclient/version_info";
})(OdooEndpoint || (exports.OdooEndpoint = OdooEndpoint = {}));
//# sourceMappingURL=types.js.map