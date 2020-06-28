# Tofu
A remaster of my very first web server.
I made this, because I wanted something new.. again :D
I also worked alot more with JSDoc and types in general to prevent stupid errors.

# Context
## Getters
* get **headers** {http.IncomingHttpHeaders}
* get **params** {object} - *url parameters*
* get **cookies** {object} - *client cookies*
* get **method** {string} - *http.IncomingMessage.method*
* get **url** {string} - *http.IncomingMessage.url*
* get **cleanUrl** {string} - *url without queries*
* get **host** {string} - *http.IncomingMessage.headers.host*
* get **ip** {string} - *client ip address*
* get **userAgent** {string} - *http.IncomingMessage.headers["user-agent"]*
* get **proxy** {string} - *http.IncomingMessage.headers["via"]*
* get **query** {string} - *url query*
* get **age** {string} - *http.IncomingMessage.headers["age"]*
* get **referer** {string} - *http.IncomingMessage.headers["referer"]*
* get **length** {number} - *http.IncomingMessage.headers["content-length"]*
* get **body** {string} - *IncomingMessage body*
* get **json** {object} - *IncomingMessage body (JSON.parsed)*
## Setters
* set **charset** {string} - *set output charset*
* set **type** {string} - *set output content type*
* set **cache** {string} - *set cache header*
* set **cookies** {object} - *set cookies in header*
* set **end** {boolean} - *ends response*
* set **length** {number} - *set response length*
* set **status** {number} - *set response status*
* set **header** {object} - *sets header/s*
* set **redirect** {string} - *redirect client to given url*
* set **body** {Iterable} - *sends response body*
* set **json** {object} - *sends response body (JSON.strigified)*
* set **html** {string} - *sends response body (with html presets)*
* set **render** {{string, object}} - *sends rendered string*
* set **text** {string} - *sends response body*


# Usage 
```javascript
import Tofu from "@iljucha/tofu"

let app = new Tofu()

// serves folder to client
app.serve = "./public"

// secures server response
app.secure = true

// add route with the route setter
app.route = {
  method: "GET",
  route: "/",
  handler: ctx => ctx.body = "home
}

// add multiple routes with the routes setter
app.routes = [
  {
    method: "GET,
    route: "/user/:alias",
    handler: ctx => ctx.json = ctx.locals
  }
]

// add route with method methods // get, post, put, ...
app.get("/get", ctx => ctx.end = true)

// add single plugin with no specific route with the plugin setter
app.plugin = (ctx, next) => {
  setTimeout(() => {
    ctx.locals.coolPlugin = true
    next()
  })
}

// add multiple plugins with no specific routes with the plugins setter
app.plugins = [
  (ctx, next) => {
    ctx.locals.coolPlugin2 = true
    next()
  }
]

// add plugin for specific route with use method
app.use("/plugin", (ctx, next) => {
  ctx.locals.coolPlugin3 = true
  next()
})

// finally listen to port
app.listen(3000)
```
