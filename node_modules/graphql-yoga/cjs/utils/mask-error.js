"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskError = void 0;
const utils_1 = require("@graphql-tools/utils");
const error_js_1 = require("../error.js");
const maskError = (error, message, isDev = globalThis.process?.env?.['NODE_ENV'] === 'development') => {
    if ((0, error_js_1.isGraphQLError)(error)) {
        if (error.originalError) {
            if (error.originalError.name === 'GraphQLError') {
                return error;
            }
            return (0, utils_1.createGraphQLError)(message, {
                nodes: error.nodes,
                source: error.source,
                positions: error.positions,
                path: error.path,
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                    ...error.extensions,
                    unexpected: true,
                    ...(isDev
                        ? {
                            originalError: {
                                message: error.originalError.message,
                                stack: error.originalError.stack,
                            },
                        }
                        : {}),
                },
            });
        }
        return error;
    }
    return (0, utils_1.createGraphQLError)(message, {
        extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            unexpected: true,
            originalError: isDev
                ? error instanceof Error
                    ? {
                        message: error.message,
                        stack: error.stack,
                    }
                    : error
                : undefined,
        },
    });
};
exports.maskError = maskError;
