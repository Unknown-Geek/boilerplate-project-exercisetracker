const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const env = require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(express.json()); // To parse JSON bodies

mongoose.connect("mongodb+srv://shravanpandala:LC1TxA5b9rQYHJXJ@cluster0.garka.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date,
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema]
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  try {
    const user = await User.create({ username });
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const exercise = {
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    };

    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    let log = user.log;

    if (from) {
      const fromDate = new Date(from);
      log = log.filter(exercise => exercise.date >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      log = log.filter(exercise => exercise.date <= toDate);
    }

    if (limit) {
      log = log.slice(0, Number(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
