import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Express application instance
const app = express();

// Gets current file path in Express modules
const __filename = fileURLToPath(import.meta.url);
// Gets directory name of current file in Express modules
const __dirname = dirname(__filename);

// Connects to MongoDB database
mongoose.connect('mongodb://localhost:27017/matchingGameDB')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use method override middleware
app.use(methodOverride('_method'));
// Serves static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Parses URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Sets view engine to ejs
app.set('view engine', 'ejs');
// Sets directory for views
app.set('views', path.join(__dirname, 'views'));

// Defines schema for score documents
const scoreSchema = new mongoose.Schema({
  name: String,
  timeTaken: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Creates Mongoose model for scores
const Score = mongoose.model('Score', scoreSchema);

// Handles GET requests to root URL
app.get('/', (req, res) => {
  res.render('home');
});

// Handles GET requests to /games URL
app.get('/games', (req, res) => {
  res.render('games');
});

// Handles GET requests to /games/matching URL, sends matching game HTML file
app.get('/games/matching', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Matching Game', 'matching.html'));
});

// Handles POST requests to save new score
app.post('/games/matching/score', async (req, res) => {
  const { name, timeTaken } = req.body;
  try {
    const newScore = new Score({ name, timeTaken });
    await newScore.save();
    res.redirect('/games/matching/leaderboard');
  } catch (err) {
    console.error('Error saving score:', err);
    res.status(500).send('Error saving score');
  }
});

// Handles GET requests to /games/matching/leaderboard URL, fetches and displays scores
app.get('/games/matching/leaderboard', async (req, res) => {
  try {
    const scores = await Score.find({}).sort({ timeTaken: 1 });
    res.render('leaderboard', { scores });
  } catch (err) {
    console.error('Error fetching scores:', err);
    res.status(500).send('Error fetching scores');
  }
});

// Extracts YouTube video ID from a URL
// Source: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
function getYouTubeVideoID(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Handles GET requests to /videos URL, prepares video data and renders videos page
app.get('/videos', (req, res) => {
  const rawVideos = [
    { id: 1, title: 'Exercise Video 1', url: 'https://youtu.be/QHPi3tVbq6U?si=nGKwlkb5ngbLbI2b' },
    { id: 2, title: 'Exercise Video 2', url: 'https://youtu.be/8Jqe2pCVcGs?si=n9fyuXA6jCSrJxVG' },
    { id: 3, title: 'Exercise Video 3', url: 'https://youtu.be/Vnw0Mzsy8SQ?si=eukJRi4AH8HTnFPe' },
    { id: 4, title: 'Exercise Video 4', url: 'https://youtu.be/RTxYve-GwzM?si=hgV8iAOuANWAJqXl' },
    { id: 5, title: 'Exercise Video 5', url: 'https://youtu.be/oxdGXfwKE0k?si=ze34IuxgJB3H-tZk' },
    { id: 6, title: 'Exercise Video 6', url: 'https://youtu.be/aW-U66Uwm2c?si=sCuE1HLXVdpmgDhG' },
    { id: 7, title: 'Exercise Video 7', url: 'https://youtu.be/1jdCNdTqJbI?si=gH1BgDe67c6O8I1s' },
    { id: 8, title: 'Exercise Video 8', url: 'https://youtu.be/elk5PpYyF-M?si=XzfHNqw0kMXpfm1B' },
  ];

  const videos = rawVideos.map(v => {
    const vid = getYouTubeVideoID(v.url);
    return {
      ...v,
      embedUrl: `https://www.youtube.com/embed/${vid}`
    };
  });

  res.render('videos', { videos });
});

// Defines port server will listen on
const PORT = process.env.PORT || 3000;
// Starts Express server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});