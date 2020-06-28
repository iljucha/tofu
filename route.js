import Context from "./context.js"

export default class Route {
    #parameters
    #regExp
    #method
    #handler
    #route

    /**
     * @param {string} method
     * @param {string} route
     * @param {(ctx: Context, next?: () => void) => void} handler
     */
    constructor(method, route, handler) {
        this.parameters = route
        this.regExp = route
        this.method = method
        this.route = route
        this.handler = handler
    }

    static methods = ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "ALL"]

    /**
     * @param {string} method - request objects method property
     * @param {string} url - request objects url property
     */
    match(method, url) {
        if (this.route === "/*") {
            return true
        }
        let match = this.params(url)
        if (Object.keys(match).length !== this.parameters.length) {
            return false
        }
        if (match && (this.method === method || this.method === "ALL")) {
            return true
        }
        else {
            return false
        }
    }

    params(url) {
        url = url.split("?")[0] || url
        let match = this.regExp.exec(url)
        
        if (match) {
            if (match.groups) {
                return { ...match.groups }
            }
            else {
                return { }
            }
        }
        else {
            return false
        }
    }

    set regExp(value) {
        value = value.replace(/\:([a-zA-Z]+)/gi, "(?<$1>[^\\/\\:\\?]+?)")
        this.#regExp = new RegExp("^" + value + "/?$")
    }

    get regExp() {
        return this.#regExp
    }

    set method(value) {
        if (!Route.methods.includes(value)) {
            throw Error("unknown method: " + value)
        }
        this.#method = value
    }

    get method() {
        return this.#method
    }

    set handler(value) {
        this.#handler = value
    }

    get handler() {
        return this.#handler
    }

    set route(value) {
        this.#route = value
    }

    get route() {
        return this.#route
    }

    set parameters(value) {
        let params = value.match(/\:([a-zA-Z]+)/gi)
        if (params) {
            params = params.map(param => param.replace(/:/, ""))
        }
        else {
            params = []
        }
        this.#parameters = params
    }

    get parameters() {
        return this.#parameters
    }
}