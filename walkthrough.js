import Context from "./context.js"
import Route from "./route.js"

const hasBody = /(.(body|json|text|html|redirect|render|end) ?= ?)|(.output.)/
const unnecessary = /\r?\n|\r/gm

/**
 * @param {Context} context
 * @param {number} status
 * @param {Iterable} body
 */
function _error(context, status, body) {
    context.status = status
    context.body = body
}

/**
 * @param {Context} ctx
 * @param {Route[]} plugins
 * @param {Route} route
 * @param {number} i
 */
export default function Walkthrough(ctx, plugins, route, i) {
    if (plugins[i]) {
        if (plugins[i].handler.length !== 2) {
            return _error(ctx, 500, "plugin error")
        }
        plugins[i].handler(ctx, () => Walkthrough(ctx, plugins, route, i+1))
    }
    else {
        try {
            if (!route) {
                return _error(ctx, 500, "no route")
            }
            const fn = route.handler.toString().replace(unnecessary, "")
            if (hasBody.test(fn) === false) {
                return _error(ctx, 500, "missing body")
            }
            else {
                route.handler(ctx)
            }
        }
        catch (err) {
            console.log(err)
            _error(ctx, 500, "script error")
        }
    }
}