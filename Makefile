.PHONY: run stop

PORT ?= 9000

run: stop
	@python3 -m http.server $(PORT) > /dev/null 2>&1 & echo $$! > .server.pid
	@until nc -z localhost $(PORT) 2>/dev/null; do sleep 0.1; done
	@open http://localhost:$(PORT)/ 2>/dev/null || xdg-open http://localhost:$(PORT)/ 2>/dev/null
	@echo "Server running at http://localhost:$(PORT)/ (make stop to quit)"

stop:
	@[ -f .server.pid ] && kill `cat .server.pid` 2>/dev/null && rm .server.pid && echo "Server stopped" || true
