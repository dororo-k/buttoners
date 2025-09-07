require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Proxy Server is running.');
});

// --- 프록시 API 엔드포인트 --- //

// 예: /api/points
app.get('/api/points', (req, res) => {
  // 여기에 실제 외부 API를 호출하는 로직을 구현합니다.
  // const apiKey = process.env.API_KEY_POINTS;
  console.log('Received request for points');
  res.json({ success: true, message: 'Points API endpoint placeholder' });
});

// 예: /api/schedule
app.get('/api/schedule', (req, res) => {
  // 여기에 실제 외부 API를 호출하는 로직을 구현합니다.
  // const apiKey = process.env.API_KEY_SCHEDULE;
  console.log('Received request for schedule');
  res.json({ success: true, message: 'Schedule API endpoint placeholder' });
});


app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
