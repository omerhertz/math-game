const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory database for users and progress
const users = {}; 

// Game Configurations
const CONFIG = {
  TARGET_SCORE: 25, // Score needed to unlock the next level
  STAGE_TIME_SECONDS: 60
};

// 1. User Signup / Login (Name only)
app.post('/api/login', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const userId = name.toLowerCase().trim();
  if (!users[userId]) {
    users[userId] = {
      name: name.trim(),
      highestStageUnlocked: 1,
      scores: {} // stageId: highScore
    };
  }

  res.json({ user: users[userId], config: CONFIG });
});

// 2. Save Progress & Score
app.post('/api/score', (req, res) => {
  const { name, stageId, score } = req.body;
  const userId = name.toLowerCase().trim();

  if (!users[userId]) return res.status(404).json({ error: 'User not found' });

  const user = users[userId];
  const currentHighScore = user.scores[stageId] || 0;

  // Update high score
  if (score > currentHighScore) {
    user.scores[stageId] = score;
  }

  // Unlock next stage if target met
  if (score >= CONFIG.TARGET_SCORE && stageId === user.highestStageUnlocked && stageId < 10) {
    user.highestStageUnlocked += 1;
  }

  res.json({ user, config: CONFIG });
});

// 3. Problem Generator API
app.get('/api/problem/:stage', (req, res) => {
  const stage = parseInt(req.params.stage);
  const problem = generateProblem(stage);
  res.json(problem);
});

function generateProblem(stage) {
  let num1, num2, question, answer;

  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const getRandomFromList = (list) => list[Math.floor(Math.random() * list.length)];

  const stageMultipliers = {
    1: [0, 1, 2],
    2: [0, 1, 2, 3, 4],
    3: [0, 1, 2, 3, 4, 5, 6],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  };

  const newMultipliers = {
    1: [0, 1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
    5: [9, 10]
  };

  const stageDivisors = {
    6: [1, 2],
    7: [1, 2, 3, 4],
    8: [1, 2, 3, 4, 5, 6],
    9: [1, 2, 3, 4, 5, 6, 7, 8],
    10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  };

  const newDivisors = {
    6: [1, 2],
    7: [3, 4],
    8: [5, 6],
    9: [7, 8],
    10: [9, 10]
  };

  if (stage <= 5) {
    // Multiplication (60% chance to select from newly added numbers)
    const useNewNumbers = Math.random() < 0.6;
    const pool = useNewNumbers ? newMultipliers[stage] : stageMultipliers[stage];
    
    num1 = getRandomFromList(pool);
    num2 = getRandomInt(0, 10);
    
    // Randomize order
    if (Math.random() > 0.5) [num1, num2] = [num2, num1];

    question = `${num1} × ${num2}`;
    answer = num1 * num2;
  } else {
    // Division (60% chance to select from newly added divisors)
    const useNewNumbers = Math.random() < 0.6;
    const pool = useNewNumbers ? newDivisors[stage] : stageDivisors[stage];

    const divisor = getRandomFromList(pool);
    
    // Find valid max multiplier so dividend <= 100
    const maxMultiplier = Math.floor(100 / divisor);
    const quotient = getRandomInt(1, Math.min(10, maxMultiplier));
    
    const dividend = divisor * quotient;

    question = `${dividend} ÷ ${divisor}`;
    answer = quotient;
  }

  return { question, answer };
}

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
