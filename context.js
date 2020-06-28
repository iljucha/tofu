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
     */
    constructor(incomingMessage, serverResponse) {
        this.#incomingMessage = incomingMessage
        this.#serverResponse = serverResponse
    }

    get headers() {
        return this.#incomingMessage.headers
    }

    get locals() {
        return this.#locals
    }

    set locals(value) {
        this.#locals = value
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

    /**
     * @param {string} value
     */
    set charset(value) {
        this.#charset = value
    }

    /**
     * @param {string} value
     */
    set type(value) {
        this.header = { "Content-Type": value }
    }

    /**
     * @param {string} value
     */
    set cache(value) {
        this.header = { "Cache-Control": value }
    }

    /**
     * set client cookies
     * @param {object} value
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
     * or get client cookies
     */
    get cookies() {
        let rc = this.#incomingMessage.headers.cookie, cookies = {}
        rc && rc.split(";").forEach(cookie => {
            var parts = cookie.split("=")
            cookies[parts.shift().trim()] = decodeURI(parts.join("="))
        })
        return cookies
    }

    /**
     * get requested method
     */
    get method() {
        return this.#incomingMessage.method
    }

    /**
     * get host
     */
    get host() {
        return this.headers.host
    }

    /**
     * get requested url
     */
    get url() {
        return this.#incomingMessage.url
    }

    /**
     * get requested url without ?query
     */
    get cleanUrl() {
        return this.url.split("?")[0] || this.url
    }

    /**
     * get client's ip
     */
    get ip() {
        return this.headers["x-forwarded-for"] || 
            this.#incomingMessage.connection.remoteAddress || 
            this.#incomingMessage.socket.remoteAddress ||
            null
    }

    /**
     * get clients user agent
     */
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

    /**
     * @param {boolean} value
     */
    set end(value) {
        if (value !== true) {
            return
        }
        this.serverResponse.end()
    }

    /**
     * @param {number} value 
     */
    set length(value) {
        this.header = { "Content-Length": value }
    }

    /**
     * @type {number}
     */
    get length() {
        return parseInt(this.headers["content-length"]) || 0
    }

    /**
     * sets status code for answer
     * @param {number} value
     */
    set status(value) {
        this.#serverResponse.statusCode = value
    }

    /**
     * @param {object} value 
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
     * redirect client to given url
     * @param {string} value
     */
    set redirect(value) {
        this.status = 301
        this.header = { "Location": value }
        this.end = true
    }

    /**
     * sends answer to client
     * @param {Iterable} value 
     */
    set body(value) {
        let readable = Readable.from(value)
        readable.on("data", stream => {
            this.header = { "Connection": "close" }
            this.length = Buffer.byteLength(stream, this.#charset || null)
            this.#serverResponse.end(stream, this.#charset || null)
        })
    }

    /**
     * or get client request body
     */
    get body() {
        return this.#locals.body
    }

    /**
     * sends JSON object to client
     * @param {object} value
     */
    set json(value) {
        this.type = "application/json; utf-8"
        this.charset = "utf-8"
        this.body = JSON.stringify(value)
    }

    /**
     * or get client request body (JSON)
     */
    get json() {
        try {
            return JSON.parse(this.#locals.body)
        }
        catch (error) {
            return {}
        }
    }

    /**
     * sends html content to client
     * @param {string} value
     */
    set html(value) {
        this.type = "text/html; utf-8"
        this.charset = "utf-8"
        this.body = value
    }

    /**
     * sends html content to client
     * @param {object} value
     * @param {string} value.template
     * @param {object} value.placeholders
     */
    set render(value) {
        this.type = "text/html; utf-8"
        this.charset = "utf-8"
        this.body = Render(value.template, value.placeholders)
    }

    /**
     * sends text content to client
     * @param {string} value
     */
    set text(value) {
        this.type = "text/plain; utf-8"
        this.charset = "utf-8"
        this.body = value
    }

    /**
     * 
     * @param {Route[]} _plugins 
     * @param {Route[]} _routes 
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
                if (Buffer.concat(body).toString()) {
                    ctx.locals.body = Buffer.concat(body).toString()
                }
                if (route) {
                    ctx.locals.params = route.params(ctx.url)
                }
                const plugins = _plugins.filter(plugin => plugin.match(ctx.method, ctx.url))
                Walkthrough(ctx, plugins, route, 0)
            })
        }
        return requestListener
    }
}
