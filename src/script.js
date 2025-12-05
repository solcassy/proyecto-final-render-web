const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;

    // Tamaños básicos
    const paddleWidth  = 12;
    const paddleHeight = 80;
    const ballSize     = 10;

    // Jugador (izq) y CPU (der)
    const player = {
      x: 20,
      y: (H - paddleHeight) / 2,
      vy: 0,
      speed: 6,
      score: 0
    };

    const cpu = {
      x: W - 20 - paddleWidth,
      y: (H - paddleHeight) / 2,
      vy: 0,
      speed: 4.5,
      score: 0
    };

    const ball = {
      x: W / 2,
      y: H / 2,
      vx: 4,
      vy: 3,
      size: ballSize
    };

    const keys = {
      up: false,
      down: false
    };

    // Controles
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
      if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    });

    window.addEventListener('keyup', (e)=>{
      if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
      if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    });

    function resetBall(direction = 1){
      ball.x = W / 2;
      ball.y = H / 2;
      ball.vx = 4 * direction;
      ball.vy = (Math.random() * 4 - 2); // -2 a 2
    }

    function update(){
      // Movimiento jugador
      if(keys.up)   player.y -= player.speed;
      if(keys.down) player.y += player.speed;

      // Limites jugador
      if(player.y < 0) player.y = 0;
      if(player.y + paddleHeight > H) player.y = H - paddleHeight;

      // Movimiento CPU (IA muy simple)
      const cpuCenter = cpu.y + paddleHeight / 2;
      if(cpuCenter < ball.y - 10) cpu.y += cpu.speed;
      else if(cpuCenter > ball.y + 10) cpu.y -= cpu.speed;

      // Límites CPU
      if(cpu.y < 0) cpu.y = 0;
      if(cpu.y + paddleHeight > H) cpu.y = H - paddleHeight;

      // Movimiento pelota
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Rebote arriba / abajo
      if(ball.y <= 0 || ball.y + ball.size >= H){
        ball.vy *= -1;
      }

      // Colisión con paleta jugador
      if(
        ball.x <= player.x + paddleWidth &&
        ball.x >= player.x &&
        ball.y + ball.size >= player.y &&
        ball.y <= player.y + paddleHeight
      ){
        ball.vx *= -1;
        // pequeño efecto según dónde pega
        const hitPos = (ball.y + ball.size/2) - (player.y + paddleHeight/2);
        ball.vy = hitPos * 0.15;
      }

      // Colisión con paleta CPU
      if(
        ball.x + ball.size >= cpu.x &&
        ball.x + ball.size <= cpu.x + paddleWidth &&
        ball.y + ball.size >= cpu.y &&
        ball.y <= cpu.y + paddleHeight
      ){
        ball.vx *= -1;
        const hitPos = (ball.y + ball.size/2) - (cpu.y + paddleHeight/2);
        ball.vy = hitPos * 0.15;
      }

      // Punto para CPU
      if(ball.x + ball.size < 0){
        cpu.score++;
        resetBall(1);
      }

      // Punto para jugador
      if(ball.x > W){
        player.score++;
        resetBall(-1);
      }
    }

    function drawNet(){
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = '#ff44aa';
      ctx.beginPath();
      ctx.moveTo(W/2, 0);
      ctx.lineTo(W/2, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function draw(){
      ctx.clearRect(0, 0, W, H);

      // Fondo
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Red central
      drawNet();

      // Paletas
      ctx.fillStyle = '#ff44aa';
      ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
      ctx.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);

      // Pelota
      ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

      // Marcador
      ctx.font = 'bold 32px "Y2K Brutalism", monospace';
      ctx.textAlign = 'center';
      
      // Efecto de brillo azul claro
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#00aaff';
      
      ctx.fillText(player.score, W/2 - 40, 40);
      ctx.fillText(cpu.score, W/2 + 40, 40);
      
      // Resetear sombra
      ctx.shadowBlur = 0;
    }

    function loop(){
      update();
      draw();
      requestAnimationFrame(loop);
    }

    // start
    resetBall();
    loop();