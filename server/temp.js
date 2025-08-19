const mongoose = require("mongoose");
const Movie = require("./models/Movie");
const dotenv = require("dotenv");

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const one = await Movie.findOne();
  console.log(one);
  await mongoose.disconnect();
})();
