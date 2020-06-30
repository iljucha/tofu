import Context from "./context.js"
import Route from "./route.js"

const hasBody = /(.(body|json|text|html|redirect|render|end|throw) ?= ?)|.(output|assert)/
const unnecessary = /\r?\n|\r/gm

/**
 * @param {Context} ctx
 * @param {Route[]} plugins
 * @param {Route} route
 * @param {number} i
 */
export default function Walkthrough(ctx, plugins, route, i) {
    if (plugins[i]) {
        if (plugins[i].handler.length !== 2) {
            ctx.status = 418
            return ctx.end = true
        }
        try {
            plugins[i].handler(ctx, () => Walkthrough(ctx, plugins, route, i+1))
        }
        catch (err) {
            ctx.status = 500
            return ctx.end = true
        }
    }
    else {
        try {
            if (!route) {
                ctx.status = 404
                return ctx.end = true
            }
            const fn = route.handler.toString().replace(unnecessary, "")
            if (hasBody.test(fn) === false) {
                ctx.status = 500
                return ctx.end = true
            }
            else {
                route.handler(ctx)
            }
        }
        catch (err) {
            if (typeof err === Error) {
                console.log(err)
            }
            ctx.status = ctx.status || 500
            return ctx.end = true
        }
    }
}