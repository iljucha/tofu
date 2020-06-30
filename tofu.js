// @ts-check
import http from "http"
import Context from "./context.js"
import Route from "./route.js"
import serve from "@iljucha/tofu/plugins/serve.js"
import secure from "@iljucha/tofu/plugins/secure.js"

/**
 * @typedef {(context: Context, next: () => void) => void} Plugin
 * @typedef {(context: Context) => void} Handler
 */

/**
 * a little too simplistic web server
 */
export default class Tofu {
    /** @type {http.Server} */
    #server
    /** @type {Route[]} */
    #routes = []
    /** @type {Route[]} */
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
        Tofu.assert(process.platform === "linux", "serve can only be used on Linux Systems")
        this.use("/*", (ctx, next) => serve(value, ctx, next))
    }

    /**
     * secures web server responses
     * @param {boolean} value
     * @example
     * app.secure = true
     */
    set secure(value) {
        Tofu.assert(value === true, "only true is accepted")
        this.plugin(secure())
    }

    /**
     * adds plugin
     * @param {Plugin} value 
     */
    plugin(value) {
        Tofu.assert(typeof value === "function", "wrong type for handler")
        this.use("/*", value)
    }

    /**
     * adds plugins
     * @param {Plugin[]} value 
     */
    plugins(value) {
        Tofu.assert(Array.isArray(value), "only arrays are accepted")
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
        Tofu.assert(typeof route === "string", "wrong type for route")
        Tofu.assert(typeof handler === "function", "wrong type for handler")
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
        Tofu.assert(typeof value.method === "string", "wrong type for method")
        Tofu.assert(typeof value.route === "string", "wrong type for route")
        Tofu.assert(typeof value.handler === "function", "wrong type for handler")
        let { method, route, handler } = value
        this.#routes.push(new Route(method, route, handler))
    }

    /**
     * adds route to app
     * @param {{method: string, route: string, handler: Handler}[]} value
     */
    routes(value) {
        Tofu.assert(Array.isArray(value), "only arrays are accepted")
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
        Tofu.assert(typeof port === "number", "port must be a number")
        this.#server.listen(port)
        return this
    }

    /**
     * if condition fails, it throws
     * @param {any} condition 
     * @param {string} message
     * @example
     * Tofu.assert(false, "false will never be true") // throws
     * Tofu.assert(true, "true will be true") // does nothing
     */
    static assert(condition, message) {
        if (!condition) {
            throw message
        }
    }
}