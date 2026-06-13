const app = require("./app");
const { initDb } = require("./db/init");
const { scheduleJobs } = require("./jobs/scheduler");

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    scheduleJobs();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database initialization failed", err);
    process.exit(1);
  });
