export default function secure() {
    return (ctx, next) => {
        ctx.headers = {
            "X-XSS-Protection": "1; mode=block",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-Download-Options": "noopen",
            "X-Robots-Tag": "noarchive",
            "Referrer-Policy": "no-referrer",
            "Content-Security-Policy": 
                "default-src 'none';" +
                "script-src 'self';" +
                "connect-src 'self';" +
                "img-src 'self' data:;" +
                "style-src 'self' 'unsafe-inline';" +
                "font-src 'self';",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "pragma": "no-cache"
        }
        next()
    }
}