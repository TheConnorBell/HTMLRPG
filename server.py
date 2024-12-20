import http.server
import socketserver

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    pass

Handler.extensions_map['.shtml'] = 'text/html'
Handler.extensions_map['.js'] = 'application/javascript'

httpd = socketserver.TCPServer(("", PORT), Handler)

print("serving on port " + str(PORT))
httpd.serve_forever()