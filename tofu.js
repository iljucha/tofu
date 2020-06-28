// @ts-check
import http from "http"
import Context from "./context.js"
import Route from "./route.js"
import serve from "@iljucha/tofu/plugins/serve.js"
import secure from "@iljucha/tofu/plugins/secure.js"

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
     */
    set serve(value) {
        if (process.platform !== "linux") {
            throw Error("Server.serve can only be used on Linux Systems")
        }
        this.use("/*", (ctx, next) => serve(value, ctx, next))
    }

    /**
     * secures web server responses
     * @param {boolean} value
     */
    set secure(value) {
        if (value !== true) {
            return
        }
        this.plugin = secure()
    }

    /**
     * adds plugin
     * @param {(context: Context, next: () => void) => void} value 
     */
    set plugin(value) {
        this.use("/*", value)
    }

    /**
     * adds plugins
     * @param {(context: Context, next: () => void) => void[]} value 
     */
    set plugins(value) {
        const plugins = value
        const length = plugins.length
        let i = 0
        for (i; i < length; i++) {
            this.plugin = plugins[i]
        }
    }

    /**
     * @param {string} route 
     * @param {(context: Context, next: () => void) => void} handler 
     */
    use(route, handler) {
        this.#plugins.push(new Route("ALL", route, handler))
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    all(route, handler) {
        this.route = { method: "ALL", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    get(route, handler) {
        this.route = { method: "GET", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    head(route, handler) {
        this.route = { method: "HEAD", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    post(route, handler) {
        this.route = { method: "POST", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    put(route, handler) {
        this.route = { method: "PUT", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    delete(route, handler) {
        this.route = { method: "DELETE", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    patch(route, handler) {
        this.route = { method: "PATCH", route, handler }
        return this
    }

    /**
     * @param {string} route 
     * @param {(context: Context) => void} handler 
     */
    options(route, handler) {
        this.route = { method: "OPTIONS", route, handler }
        return this
    }

    /**
     * adds route to app
     * @param {{method: string, route: string, handler: (ctx: Context) => void}} value
     */
    set route(value) {
        let { method, route, handler } = value
        this.#routes.push(new Route(method, route, handler))
    }

    /**
     * adds route to app
     * @param {{method: string, route: string, handler: (ctx: Context) => void}[]} value
     */
    set routes(value) {
        const routes = value
        const length = routes.length
        let i = 0
        for (i; i < length; i++) {
            this.route = routes[i]
        }
    }

    /**
     * **Tofu** web server listens to given port
     * @param {number} port 
     */
    listen(port) {
        this.#server.listen(port)
        return this
    }
}