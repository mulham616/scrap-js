const mongoose = require('mongoose')

mongoose.connect(
  process.env.DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
  .then(() => {
    console.log('Database is connected!', process.env.DB_URI);
  })
  .catch((err) => {
    console.log('Database not ready!', process.env.DB_URI);
    console.error(err);
  });