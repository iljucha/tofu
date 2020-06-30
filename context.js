// @ts-check
import http from "http"
import url from "url"
import { Readable } from "stream"
import Walkthrough from "./walkthrough.js"
import Route from "./route.js"
import Render from "@iljucha/render"

export default class Context {
    /** @type {http.IncomingMessage} */
    #incomingMessage
    /** @type {http.ServerResponse} */
    #serverResponse
    /** @type {any} */
    #charset
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

    // Setters
    /**
     * @param {string} value
     * @example
     * // set response charset encoding
     * ctx.charset = "utf-8"
     */
    set charset(value) {
        if (!value) {
            return
        }
        this.#charset = value
    }

    /**
     * @param {string} value
     * @example
     * // set response content-type header
     * ctx.type = "text/plain; utf-8"
     */
    set type(value) {
        this.header = { "Content-Type": value }
    }

    /**
     * @param {string} value
     * @example
     * // set response cache-control header
     * ctx.cache = "public"
     */
    set cache(value) {
        this.header = { "Cache-Control": value }
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
        this.header = { "Set-Cookie": array }
    }

    /**
     * @param {boolean} value
     * @example
     * // end response
     * ctx.end = true
     */
    set end(value) {
        if (value !== true) {
            return
        }
        this.body = ""
    }

    /**
     * @param {number} value 
     * @example
     * // set response content-length header
     * ctx.length = 100
     * // get request content-length header
     * console.log(ctx.length)
     */
    set length(value) {
        this.header = { "Content-Length": value }
    }

    get length() {
        return parseInt(this.headers["content-length"]) || 0
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
     * ctx.header = {
     *      "Content-Length": 100,
     *      "Content-Type": "text/html; utf-8"
     * }
     */
    set header(value) {
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
        this.header = { "Location": value }
        this.end = true
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
                this.header = { "Connection": "close" }
                this.length = Buffer.byteLength(stream, this.#charset || null)
                this.#serverResponse.end(stream)
            }
            catch (error) {
                if (error.code !== "ERR_HTTP_HEADERS_SENT") {
                    console.log(error)
                }
            }
        })
    }

    /**
     * @param {object} value
     * @param {number} value.status
     * @param {string} value.message
     * @param {object} [value.info]
     * @example
     * // throws JSON formatted request body
     * ctx.throw = {
     *      status: 500,
     *      message: "internal server error",
     *      info: {
     *          contact: "me(at)work.com"
     *      }
     * }
     */
    set throw(value) {
        let { status, message, info } = value
        this.status = status
        throw this.json = { message, info }
    }

    /**
     * @param {string} value
     * @example
     * // send HTML formatted response body
     * ctx.html = `<!DOCTYPE html>...`
     */
    set html(value) {
        this.type = "text/html; utf-8"
        this.charset = "utf-8"
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
        this.charset = "utf-8"
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
        this.charset = "utf-8"
        this.body = value
    }

    // Getters
    get headers() {
        return this.#incomingMessage.headers
    }

    get body() {
        return this.#locals.body
    }

    get locals() {
        return this.#locals
    }

    get incomingMessage() {
        return this.#incomingMessage
    }

    get serverResponse() {
        return this.#serverResponse
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

    get output() {
        return {
            /** @param {number} status */
            status: status => {
                this.status = status
                return this.output
            },
            /** @param {string} input */
            cache: input => { 
                this.cache = input 
                return this.output
            },
            /** @param {string} input */
            type: input => {
                this.type = input
                return this.output
            },
            /** @param {string} input */
            charset: input => {
                this.charset = input
                return this.output
            },
            /** @param {string} url */
            redirect: url => { this.redirect = url },
            /** @param {Iterable} input */
            body: input => { this.body = input },
            /** @param {object} input */
            json: input => { this.json = input },
            /** @param {string} input */
            text: input => { this.text = input },
            /** @param {string} input */
            html: input => { this.html = input },
            /**
             * @param {string} template
             * @param {object} placeholders
             */
            render: (template, placeholders) => {
                this.render = { template, placeholders }
            }
        }
    }

    /**
     * @param {any} assertion 
     * @param {number} status 
     * @param {string} message 
     * @param {any} [info]
     * @example
     * // will not throw json object to
     * ctx.assert(true, 500, "never happens", { extra: "you will never see this" })
     * // will always throw
     * ctx.assert(false, 500, "always happens", { extra: "you will only see this" })
     */
    assert(assertion, status, message, info) {
        if (!assertion) {
            this.throw = { status, message, info }
        }
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
        this.charset = "utf-8"
        this.body = JSON.stringify(value)
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
     * @param {Route[]} _plugins 
     * @param {Route[]} _routes
     * @returns {(incomingMessage: http.IncomingMessage, serverResponse: http.ServerResponse) => void}
     */
    static build(_plugins, _routes) {
        /**
         * @param {http.IncomingMessage} incomingMessage
         * @param {http.ServerResponse} serverResponse
         */
        function requestListener(incomingMessage, serverResponse) {
            /** @type {any} */
            let body = []
            incomingMessage.on("data", chunk => body.push(chunk) )
            incomingMessage.on("end", () => {
                let ctx = new Context(incomingMessage, serverResponse)
                let route = _routes.find(route => route.match(ctx.method, ctx.url))
                const plugins = _plugins.filter(plugin => plugin.match(ctx.method, ctx.url))
                if (Buffer.concat(body).toString()) {
                    ctx.locals.body = Buffer.concat(body).toString()
                }
                if (route) {
                    ctx.locals.params = route.params(ctx.url)
                }
                Walkthrough(ctx, plugins, route, 0)
            })
        }
        return requestListener
    }
}