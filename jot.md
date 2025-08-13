launch -> gameBegin()

keydown(W) ->
- padLeft.goingUp = TRUE
keyup(W) ->
- padLeft.goingUp = FALSE
...
keydown(Enter) ->
- initPongElement(context, padLeft, padRight, ball)
- window.requestAnimationFrame(playFrame)

playFrame(timestamp) ->
- padLeft.move(timestamp - zero)
- padRight.move(timestamp - zero)
- ball.move(timestamp - zero) //check collision and modify movement vector accordingly
- context.clearRect()
- drawFrame(context, padLeft, padRight, ball)
- context.fill()
- window.requestAnimationFrame(playFrame)
