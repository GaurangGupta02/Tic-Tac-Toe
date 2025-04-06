let currentPlayer = 'X';
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let vsComputer = false;
    let gameMode = '';
    let socket = null;
    let roomCode = '';
    let playerRole = '';
    let playerName = '';
    let opponentName = '';

    const winningConditions = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    // DOM Elements
    const startMenu = document.getElementById('start-menu');
    const gameContainer = document.getElementById('game-container');
    const roomMenu = document.getElementById('room-menu');
    const roomCreate = document.getElementById('room-create');
    const roomJoin = document.getElementById('room-join');
    const roomWaiting = document.getElementById('room-waiting');
    const statusDisplay = document.getElementById('status');
    const cells = document.querySelectorAll('.cell');
    const resetButton = document.getElementById('reset');
    const backButton = document.getElementById('back');
    const pvpButton = document.getElementById('pvp');
    const pvcButton = document.getElementById('pvc');
    const onlineButton = document.getElementById('online');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const backToMenuButton = document.getElementById('back-to-menu');
    const connectRoomButton = document.getElementById('connect-room');
    const cancelJoinButton = document.getElementById('cancel-join');
    const cancelWaitingButton = document.getElementById('cancel-waiting');
    const roomCodeInput = document.getElementById('room-code');
    const roomCodeCreateInput = document.getElementById('room-code-input');
    const displayRoomCode = document.getElementById('display-room-code');
    const gameTitle = document.getElementById('game-title');
    const themeToggle = document.getElementById('theme-toggle');
    const playerXName = document.getElementById('player-x-name');
    const playerOName = document.getElementById('player-o-name');
    const gamePlayerX = document.getElementById('game-player-x');
    const gamePlayerO = document.getElementById('game-player-o');
    const waitingMessage = document.getElementById('waiting-message');
    const generateCodeBtn = document.getElementById('generate-code');
    const createRoomButton = document.getElementById('create-room');
    const cancelCreateButton = document.getElementById('cancel-create');

    // Initialize the app
    document.addEventListener('DOMContentLoaded', () => {
      const storedTheme = localStorage.getItem('darkMode');
      if (storedTheme === 'true') {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
      
      // Generate a random player name
      playerName = `Player${Math.floor(Math.random() * 1000)}`;
    });

    // Event Listeners
    pvpButton.addEventListener('click', () => startGame('pvp'));
    pvcButton.addEventListener('click', () => startGame('pvc'));
    onlineButton.addEventListener('click', () => showRoomMenu());
    resetButton.addEventListener('click', resetGame);
    backButton.addEventListener('click', backToMenu);
    backToMenuButton.addEventListener('click', backToMenuFromRoom);
    createRoomBtn.addEventListener('click', showCreateRoom);
    joinRoomBtn.addEventListener('click', showJoinRoom);
    connectRoomButton.addEventListener('click', joinRoom);
    cancelJoinButton.addEventListener('click', cancelJoin);
    cancelWaitingButton.addEventListener('click', cancelWaiting);
    generateCodeBtn.addEventListener('click', generateRandomCode);
    createRoomButton.addEventListener('click', createRoom);
    cancelCreateButton.addEventListener('click', cancelCreate);
    themeToggle.addEventListener('click', toggleTheme);
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));

    // Theme functions
    function toggleTheme() {
      if (document.body.classList.contains('dark-theme')) {
        disableDarkMode();
        localStorage.setItem('darkMode', 'false');
      } else {
        enableDarkMode();
        localStorage.setItem('darkMode', 'true');
      }
    }

    function enableDarkMode() {
      document.body.classList.add('dark-theme');
      themeToggle.textContent = '☀️ Light Mode';
    }

    function disableDarkMode() {
      document.body.classList.remove('dark-theme');
      themeToggle.textContent = '🌙 Dark Mode';
    }

    // Game functions
    function startGame(mode) {
      gameMode = mode;
      vsComputer = mode === 'pvc';
      startMenu.classList.add('hidden');
      gameContainer.classList.remove('hidden');
      
      if (mode === 'pvp') {
        gameTitle.textContent = 'Player vs Player';
        gamePlayerX.textContent = 'Player 1';
        gamePlayerO.textContent = 'Player 2';
      } else if (mode === 'pvc') {
        gameTitle.textContent = 'Player vs Computer';
        gamePlayerX.textContent = 'You';
        gamePlayerO.textContent = 'Computer';
      }
      
      resetGame();
      if (vsComputer && currentPlayer === 'O') {
        setTimeout(computerMove, 500);
      }
    }

    function backToMenu() {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      gameContainer.classList.add('hidden');
      roomMenu.classList.add('hidden');
      roomCreate.classList.add('hidden');
      roomJoin.classList.add('hidden');
      roomWaiting.classList.add('hidden');
      startMenu.classList.remove('hidden');
    }

    function backToMenuFromRoom() {
      roomMenu.classList.add('hidden');
      startMenu.classList.remove('hidden');
    }

    function showRoomMenu() {
      startMenu.classList.add('hidden');
      roomMenu.classList.remove('hidden');
    }

    function showCreateRoom() {
      roomMenu.classList.add('hidden');
      roomCreate.classList.remove('hidden');
      roomCodeCreateInput.value = '';
    }

    function showJoinRoom() {
      roomMenu.classList.add('hidden');
      roomJoin.classList.remove('hidden');
      roomCodeInput.value = '';
    }

    function cancelCreate() {
      roomCreate.classList.add('hidden');
      roomMenu.classList.remove('hidden');
    }

    function cancelJoin() {
      roomJoin.classList.add('hidden');
      roomMenu.classList.remove('hidden');
    }

    function cancelWaiting() {
      if (socket) {
        socket.emit('leave-room', roomCode);
        socket.disconnect();
        socket = null;
      }
      roomWaiting.classList.add('hidden');
      roomMenu.classList.remove('hidden');
    }

    function generateRandomCode() {
      const code = Math.floor(1000 + Math.random() * 9000);
      roomCodeCreateInput.value = code;
    }

    function createRoom() {
      const code = roomCodeCreateInput.value.trim();
      
      if (!code || code.length !== 4 || isNaN(code)) {
        alert('Please enter a valid 4-digit room code');
        return;
      }
      
      roomCode = code;
      
      // Connect to Socket.io server
      socket = io('https://tic-tac-toe-socket-server.glitch.me'); // Replace with your server URL
      
      roomCreate.classList.add('hidden');
      roomWaiting.classList.remove('hidden');
      displayRoomCode.textContent = roomCode;
      
      socket.on('connect', () => {
        // Create the room
        socket.emit('create-room', { roomCode, playerName });
        
        // Set player as X (first player)
        playerRole = 'X';
        playerXName.textContent = 'You';
        waitingMessage.textContent = 'Waiting for another player to join...';
      });
      
      setupSocketListeners();
    }

    function joinRoom() {
      const code = roomCodeInput.value.trim();
      
      if (!code || code.length !== 4 || isNaN(code)) {
        alert('Please enter a valid 4-digit room code');
        return;
      }
      
      roomCode = code;
      
      // Connect to Socket.io server
      socket = io('https://tic-tac-toe-socket-server.glitch.me'); // Replace with your server URL
      
      roomJoin.classList.add('hidden');
      roomWaiting.classList.remove('hidden');
      displayRoomCode.textContent = roomCode;
      
      socket.on('connect', () => {
        // Join the room
        socket.emit('join-room', { roomCode, playerName });
        
        // Set player as O (second player)
        playerRole = 'O';
        playerOName.textContent = 'You';
        waitingMessage.textContent = 'Connecting to room...';
      });
      
      setupSocketListeners();
    }

    function setupSocketListeners() {
      socket.on('room-created', (data) => {
        console.log('Room created:', data.roomCode);
      });
      
      socket.on('room-joined', (data) => {
        console.log('Joined room:', data.roomCode);
        if (playerRole === 'X') {
          playerOName.textContent = data.opponentName;
          opponentName = data.opponentName;
          waitingMessage.textContent = 'Game is starting...';
          
          // Start the game after a short delay
          setTimeout(() => {
            startOnlineGame();
          }, 1000);
        }
      });
      
      socket.on('player-joined', (data) => {
        console.log('Player joined:', data.playerName);
        playerOName.textContent = data.playerName;
        opponentName = data.playerName;
        waitingMessage.textContent = 'Game is starting...';
        
        // Start the game after a short delay
        setTimeout(() => {
          startOnlineGame();
        }, 1000);
      });
      
      socket.on('move-made', (data) => {
        if (data.player !== playerRole) {
          makeMove(data.index, data.player);
        }
      });
      
      socket.on('game-reset', () => {
        resetGame();
        statusDisplay.textContent = playerRole === 'X' ? 'Your Turn (X)' : `Waiting for ${opponentName}...`;
      });
      
      socket.on('player-left', () => {
        alert('Your opponent has left the game. Returning to menu.');
        backToMenu();
      });
      
      socket.on('room-full', () => {
        alert('Room is full. Please try another room.');
        backToMenu();
      });
      
      socket.on('room-not-found', () => {
        alert('Room not found. Please check the code and try again.');
        backToMenu();
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }

    function startOnlineGame() {
      roomWaiting.classList.add('hidden');
      gameContainer.classList.remove('hidden');
      gameTitle.textContent = 'Online Tic-Tac-Toe';
      gamePlayerX.textContent = playerRole === 'X' ? 'You' : opponentName;
      gamePlayerO.textContent = playerRole === 'O' ? 'You' : opponentName;
      
      resetGame();
      gameMode = 'online';
      
      if (playerRole === 'O') {
        statusDisplay.textContent = `Waiting for ${opponentName}...`;
      } else {
        statusDisplay.textContent = 'Your Turn (X)';
      }
    }

    function handleCellClick(e) {
      if (!gameActive || (gameMode === 'online' && currentPlayer !== playerRole)) return;
      
      const clickedCell = e.target;
      const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
      
      if (gameState[clickedCellIndex] !== '') return;
      
      if (gameMode === 'online') {
        // In online mode, emit the move to the server
        socket.emit('make-move', { roomCode, index: clickedCellIndex, player: playerRole });
        makeMove(clickedCellIndex, playerRole);
      } else {
        makeMove(clickedCellIndex, currentPlayer);
        if (!gameActive) return;
        if (vsComputer && currentPlayer === 'O') {
          setTimeout(computerMove, 500);
        }
      }
    }

    function makeMove(index, player) {
      gameState[index] = player;
      const cell = document.querySelector(`[data-index="${index}"]`);
      cell.textContent = player;
      cell.classList.add(player.toLowerCase());
      checkResult();
    }

    function computerMove() {
      if (!gameActive) return;
      const emptyCells = gameState.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
      
      // Try to win
      for (let combo of winningConditions) {
        const [a, b, c] = combo;
        if (gameState[a] === 'O' && gameState[b] === 'O' && gameState[c] === '') return makeMove(c, 'O');
        if (gameState[a] === 'O' && gameState[c] === 'O' && gameState[b] === '') return makeMove(b, 'O');
        if (gameState[b] === 'O' && gameState[c] === 'O' && gameState[a] === '') return makeMove(a, 'O');
      }
      
      // Block player from winning
      for (let combo of winningConditions) {
        const [a, b, c] = combo;
        if (gameState[a] === 'X' && gameState[b] === 'X' && gameState[c] === '') return makeMove(c, 'O');
        if (gameState[a] === 'X' && gameState[c] === 'X' && gameState[b] === '') return makeMove(b, 'O');
        if (gameState[b] === 'X' && gameState[c] === 'X' && gameState[a] === '') return makeMove(a, 'O');
      }
      
      // Take center if available
      if (gameState[4] === '') return makeMove(4, 'O');
      
      // Take a corner if available
      const corners = [0, 2, 6, 8];
      const emptyCorners = corners.filter(index => gameState[index] === '');
      if (emptyCorners.length > 0) {
        return makeMove(emptyCorners[Math.floor(Math.random() * emptyCorners.length)], 'O');
      }
      
      // Take any available spot
      if (emptyCells.length > 0) {
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        makeMove(randomIndex, 'O');
      }
    }

    function checkResult() {
      for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
          gameActive = false;
          
          if (gameMode === 'pvp') {
            statusDisplay.textContent = `Player ${gameState[a]} Wins!`;
          } else if (gameMode === 'pvc') {
            statusDisplay.textContent = gameState[a] === 'X' ? 'You Win!' : 'Computer Wins!';
          } else {
            // Online mode
            if (gameState[a] === playerRole) {
              statusDisplay.textContent = 'You Win!';
            } else {
              statusDisplay.textContent = `${opponentName} Wins!`;
            }
          }
          
          highlightWinningCells(condition);
          return;
        }
      }
      
      if (!gameState.includes('')) {
        gameActive = false;
        statusDisplay.textContent = "Game Ended in a Draw!";
        return;
      }
      
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      
      if (gameMode === 'pvp') {
        statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
      } else if (gameMode === 'pvc') {
        statusDisplay.textContent = currentPlayer === 'X' ? 'Your Turn (X)' : 'Computer Thinking...';
      } else {
        // Online mode
        if (currentPlayer === playerRole) {
          statusDisplay.textContent = 'Your Turn';
        } else {
          statusDisplay.textContent = `Waiting for ${opponentName}...`;
        }
      }
    }

    function highlightWinningCells(cells) {
      cells.forEach(index => {
        document.querySelector(`[data-index="${index}"]`).style.backgroundColor = 'var(--win-color)';
      });
    }

    function resetGame() {
      currentPlayer = 'X';
      gameState = ['', '', '', '', '', '', '', '', ''];
      gameActive = true;
      
      cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.style.backgroundColor = '';
      });
      
      if (gameMode === 'pvp') {
        statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
      } else if (gameMode === 'pvc') {
        statusDisplay.textContent = 'Your Turn (X)';
      } else if (gameMode === 'online') {
        if (socket) {
          socket.emit('reset-game', roomCode);
        }
        if (playerRole === 'X') {
          statusDisplay.textContent = 'Your Turn (X)';
        } else {
          statusDisplay.textContent = `Waiting for ${opponentName}...`;
        }
      }
      
      if (vsComputer && currentPlayer === 'O') {
        setTimeout(computerMove, 500);
      }
    }