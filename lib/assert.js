
/**
 * if condition fails, it throws
 * @param {any} condition 
 * @param {string} message
 * @example
 * assert(false, "false will never be true") // throws
 * assert(true, "true will be true") // does nothing
 */
export default function assert(condition, message) {
    if (!condition) {
        throw Error(message)
    }
}