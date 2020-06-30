import Context from "./context.js"
import Route from "./route.js"

const hasBody = /(.(body|json|text|html|redirect|render|end|throw) ?= ?)|.(output|assert)/
const unnecessary = /\r?\n|\r/gm

/**
 * @param {Context} ctx
 * @param {number} status
 * @param {Iterable} body
 */
function _error(ctx, status) {
    ctx.status = status
    ctx.end = true
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
            return _error(ctx, 418)
        }
        try {
            plugins[i].handler(ctx, () => Walkthrough(ctx, plugins, route, i+1))
        }
        catch (err) {
            return _error(ctx, 500)
        }
    }
    else {
        try {
            if (!route) {
                return _error(ctx, 404)
            }
            const fn = route.handler.toString().replace(unnecessary, "")
            if (hasBody.test(fn) === false) {
                return _error(ctx, 500)
            }
            else {
                route.handler(ctx)
            }
        }
        catch (err) {
            if (typeof err === Error) {
                console.log(err)
            }
            _error(ctx, ctx.status || 500)
        }
    }
}