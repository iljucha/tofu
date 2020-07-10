// @ts-check
import http from "http"
import Context from "./context.js"
import assert from "./assert.js"
import Route from "@iljucha/route"
import serve from "./plugins/serve.js"
import secure from "./plugins/secure.js"

/**
 * @typedef {(context: Context) => Promise} Handler
 * @typedef {(context: Context, next: () => Promise) => Promise} Plugin
 * @typedef {Route & { handler: Handler }} RouteHandler
 * @typedef {Route & { handler: Plugin }} PluginHandler
 */

/**
 * a little too simplistic web server
 */
export default class Tofu {
    /** @type {http.Server} */
    #server
    /** @type {PluginHandler[]} */
    #routes = []
    /** @type {RouteHandler[]} */
    #plugins = []

    /**
     * create a **Tofu** web server
     */
    constructor() {
        this.#server = http.createServer(Context.build(this.#plugins, this.#routes))
    }
 
    /**
     * serves the files on given path
     * @param {string} value
     * @example
     * app.serve = "./public"
     */
    set serve(value) {
        assert(process.platform === "linux", "serve can only be used on Linux Systems")
        this.use("/*", async (ctx, next) => serve(value, ctx, next))
    }

    /**
     * secures web server responses
     * @param {boolean} value
     * @example
     * app.secure = true
     */
    set secure(value) {
        assert(value === true, "only true is accepted")
        this.plugin(secure())
    }

    /**
     * adds plugin
     * @param {Plugin} value 
     */
    plugin(value) {
        assert(typeof value === "function", "wrong type for handler")
        this.use("/*", value)
    }

    /**
     * adds plugins
     * @param {Plugin[]} value 
     */
    plugins(value) {
        assert(Array.isArray(value), "only arrays are accepted")
        const plugins = value
        const length = plugins.length
        let i = 0
        for (i; i < length; i++) {
            this.plugin(plugins[i])
        }
    }

    /**
     * @param {string} route 
     * @param {Plugin} handler 
     */
    use(route, handler) {
        assert(typeof route === "string", "wrong type for route")
        assert(typeof handler === "function", "wrong type for handler")
        this.#plugins.push(new Route("ANY", route, handler))
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    all(route, handler) {
        this.route({ method: "ANY", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    get(route, handler) {
        this.route({ method: "GET", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    head(route, handler) {
        this.route({ method: "HEAD", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    post(route, handler) {
        this.route({ method: "POST", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    put(route, handler) {
        this.route({ method: "PUT", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    delete(route, handler) {
        this.route({ method: "DELETE", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    patch(route, handler) {
        this.route({ method: "PATCH", route, handler })
        return this
    }

    /**
     * @param {string} route 
     * @param {Handler} handler 
     */
    options(route, handler) {
        this.route({ method: "OPTIONS", route, handler })
        return this
    }

    /**
     * adds route to app
     * @param {{method: string, route: string, handler: Handler}} value

     */
    route(value) {
        assert(typeof value.method === "string", "wrong type for method")
        assert(typeof value.route === "string", "wrong type for route")
        assert(typeof value.handler === "function", "wrong type for handler")
        let { method, route, handler } = value
        this.#routes.push(new Route(method, route, handler))
    }

    /**
     * adds route to app
     * @param {{method: string, route: string, handler: Handler}[]} value
     */
    routes(value) {
        assert(Array.isArray(value), "only arrays are accepted")
        const routes = value
        const length = routes.length
        let i = 0
        for (i; i < length; i++) {
            this.route(routes[i])
        }
    }

    /**
     * **Tofu** web server listens to given port
     * @param {number} port 
     */
    listen(port) {
        assert(typeof port === "number", "port must be a number")
        this.#server.listen(port)
        return this
    }
}