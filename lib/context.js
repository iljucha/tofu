// @ts-check
import http from "http"
import url from "url"
import { Readable } from "stream"
import Route from "@iljucha/route"
import Render from "@iljucha/render"
import { file } from "@iljucha/tofu/plugins/serve.js"

/**
 * @typedef {(context: Context) => Promise} Handler
 * @typedef {(context: Context, next: () => Promise) => Promise} Plugin
 * @typedef {Route & { handler: Handler }} RouteHandler
 * @typedef {Route & { handler: Plugin }} PluginHandler
 */
export default class Context {
    /** @type {http.IncomingMessage} */
    #incomingMessage
    /** @type {http.ServerResponse} */
    #serverResponse
    /** @type {any} */
    #locals = {}

    /**
     * @param {http.IncomingMessage} incomingMessage 
     * @param {http.ServerResponse} serverResponse
     * @example
     * let ctx = new Context(incomingMessage, serverResponse)
     */
    constructor(incomingMessage, serverResponse) {
        this.#incomingMessage = incomingMessage
        this.#serverResponse = serverResponse
    }

    get incomingMessage() {
        return this.#incomingMessage
    }

    get serverResponse() {
        return this.#serverResponse
    }

    /**
     * @param {string} value
     * @example
     * // set response content-type header
     * ctx.type = "text/plain; utf-8"
     */
    set type(value) {
        this.headers = { "Content-Type": value }
    }

    /**
     * @param {string} value
     * @example
     * // set response cache-control header
     * ctx.cache = "public"
     */
    set cache(value) {
        this.headers = { "Cache-Control": value }
    }

    /**
     * @param {object} value
     * @example
     * // send cookies with the next reponse to the client
     * ctx.cookies = {
     *      user: "yourAlias"
     * }
     * 
     * // get clients cookies
     * console.log(ctx.cookies)
     */
    set cookies(value) {
        const object = Object.keys(value)
        const length = object.length
        let array = [], i = 0
        for (i; i < length; i++) {
            array.push(`${object[i]}=${value[object[i]]};`)
        }
        this.headers = { "Set-Cookie": array }
    }

    /**
     * @param {number|string} value 
     * @example
     * // set response content-length header
     * ctx.length = 100
     * // get request content-length header
     * console.log(ctx.length)
     */
    set length(value) {
        this.headers = { "Content-Length": value }
    }

    /**
     * @param {number} value
     * @example
     * // set response status code
     * ctx.status = 200
     * // get response status code
     * console.log(ctx.status)
     */
    set status(value) {
        this.#serverResponse.statusCode = value
    }

    /**
     * @param {object} value
     * @example
     * // set response headers
     * ctx.headers = {
     *      "Content-Length": 100,
     *      "Content-Type": "text/html; utf-8"
     * }
     */
    set headers(value) {
        const keys = Object.keys(value)
        const length = keys.length
        let i = 0, found
        for (i; i < length; i++) {
            found = this.#serverResponse.getHeader(keys[i])
            if (found) {
                this.#serverResponse.removeHeader(keys[i])
            }
            this.#serverResponse.setHeader(keys[i], value[keys[i]])
        }
    }

    /**
     * @param {string} value
     * @example
     * // redirect client to /home
     * ctx.redirect = "/home"
     */
    set redirect(value) {
        this.status = 301
        this.headers = { "Location": value }
        this.body = ""
    }

    /**
     * @param {Iterable} value
     * @example
     * // set response body
     * ctx.body = "hello world"
     * // get request body
     * console.log(ctx.body)
     */
    set body(value) {
        let readable = Readable.from(value)
        readable.on("data", stream => {
            try {
                this.headers = { "Connection": "close" }
                this.length = Buffer.byteLength(stream)
                this.#serverResponse.end(stream)
            }
            catch (error) {
                console.log(error)
            }
        })
    }

    /**
     * @param {string} value
     * @example
     * ctx.file = "./views/index.html"
     */
    set file(value) {
        file(value, this, ctx => { ctx.status = 404 })
    }

    /**
     * @param {object} value
     * @example
     * // send JSON formatted response body
     * ctx.json = {
     *      brownie: "yummy"
     * }
     * // get JSON formatted request body
     * console.log(ctx.json)
     */
    set json(value) {
        this.type = "application/json; utf-8"
        this.body = JSON.stringify(value)
    }

    /**
     * @param {string} value
     * @example
     * // send HTML formatted response body
     * ctx.html = `<!DOCTYPE html>...`
     */
    set html(value) {
        this.type = "text/html; utf-8"
        this.body = value
    }

    /**
     * @param {object} value
     * @param {string} value.template
     * @param {object} value.placeholders
     * @example
     * // sends HTML formatted template render
     * ctx.render = {
     *      template: `{{ message }}`,
     *      placeholder: {
     *          message: "i like cartoons"
     *      }
     * }
     */
    set render(value) {
        this.type = "text/html; utf-8"
        this.body = Render(value.template, value.placeholders)
    }

    /**
     * @param {string} value
     * @example
     * // set plain text response body
     * ctx.text = "hello world"
     */
    set text(value) {
        this.type = "text/plain; utf-8"
        this.body = value
    }

    // Getters
    get length() {
        return this.headers["content-length"] || 0
    }

    get headers() {
        return this.#incomingMessage.headers
    }

    get body() {
        return this.#locals.body
    }

    get locals() {
        return this.#locals
    }

    /** @type {object} */
    get params() {
        return this.locals.params
    }

    get cookies() {
        let rc = this.#incomingMessage.headers.cookie, cookies = {}
        rc && rc.split(";").forEach(cookie => {
            var parts = cookie.split("=")
            cookies[parts.shift().trim()] = decodeURI(parts.join("="))
        })
        return cookies
    }

    get method() {
        return this.#incomingMessage.method
    }

    get host() {
        return this.headers.host
    }

    get url() {
        return this.#incomingMessage.url
    }

    get cleanUrl() {
        return this.url.split("?")[0] || this.url
    }

    get ip() {
        return this.headers["x-forwarded-for"] || 
            this.#incomingMessage.connection.remoteAddress || 
            this.#incomingMessage.socket.remoteAddress ||
            null
    }

    get userAgent() {
        return this.headers["user-agent"]
    }

    get proxy() {
        return this.headers["via"]
    }

    get query() {
        return { ...url.parse(this.url, true).query }
    }

    get age() {
        return this.headers["age"]
    }

    get referer() {
        return this.headers["referer"]
    }

    get status() {
        return this.#serverResponse.statusCode
    }

    get json() {
        try {
            return JSON.parse(this.#locals.body)
        }
        catch (error) {
            return {}
        }
    }

    /**
     * **Context** is created as a requestListener for http.createServer
     * @param {PluginHandler[]} _plugins 
     * @param {RouteHandler[]} _routes
     * @returns {(incomingMessage: http.IncomingMessage, serverResponse: http.ServerResponse) => void}
     */
    static build(_plugins, _routes) {
        /**
         * @param {http.IncomingMessage} incomingMessage
         * @param {http.ServerResponse} serverResponse
         */
        function requestListener(incomingMessage, serverResponse) {
            /** @type {any} */
            const ctx = new Context(incomingMessage, serverResponse)
            const route = _routes.find(route => route.match(ctx.method, ctx.url))
            const plugins = _plugins.filter(plugin => plugin.match(ctx.method, ctx.url))

            if (route) {
                ctx.locals.params = route.params(ctx.url)
            }
            if (route && plugins.length === 0) {
                return route.handler(ctx)
            }
            if (!route && plugins.length === 0) {
                ctx.status = 404
                return ctx.body = ""
            }
            let body = []
            incomingMessage.on("data", chunk => body.push(chunk) )
            incomingMessage.on("end", () => {
                if (Buffer.concat(body).toString()) {
                    ctx.locals.body = Buffer.concat(body).toString()
                }
                Context.walkthrough(ctx, plugins, route, 0)
            })
        }
        return requestListener
    }

    /**
     * @param {Context} ctx
     * @param {PluginHandler[]} plugins
     * @param {RouteHandler} route
     * @param {number} i
     */
    static async walkthrough(ctx, plugins, route, i) {
        function endContext(error, ctx) {
            console.log(error)
            ctx.status = 500
            ctx.body = ""
        }

        if (plugins[i]) {
            try {
                let next = () => Context.walkthrough(ctx, plugins, route, i+1)
                plugins[i].handler(ctx, next)
                    .catch(error => endContext(error, ctx))
            }
            catch (error) {
                endContext(error, ctx)
            }
            return
        }

        try {
            route.handler(ctx)
                .catch(error => endContext(error, ctx))
        }
        catch (error) {
            endContext(error, ctx)
        }
    }
}