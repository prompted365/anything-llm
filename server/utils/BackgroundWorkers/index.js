const path = require("path");
const Graceful = require("@ladjs/graceful");
const Bree = require("@mintplex-labs/bree");
const setLogger = require("../logger");

class BackgroundService {
  name = "BackgroundWorkerService";
  static _instance = null;
  #root = path.resolve(__dirname, "../../jobs");

  constructor() {
    if (BackgroundService._instance) {
      this.#log("SINGLETON LOCK: Using existing BackgroundService.");
      return BackgroundService._instance;
    }

    this.logger = setLogger();
    BackgroundService._instance = this;
  }

  #log(text, ...args) {
    console.log(`\x1b[36m[${this.name}]\x1b[0m ${text}`, ...args);
  }

  async boot() {
    const { DocumentSyncQueue } = require("../../models/documentSyncQueue");
    const docSyncEnabled = await DocumentSyncQueue.enabled();

    this.#log("Starting...");
    this.bree = new Bree({
      logger: this.logger,
      root: this.#root,
      jobs: this.jobs(docSyncEnabled),
      errorHandler: this.onError,
      workerMessageHandler: this.onWorkerMessageHandler,
      runJobsAs: "process",
    });
    this.graceful = new Graceful({ brees: [this.bree], logger: this.logger });
    this.graceful.listen();
    this.bree.start();
    this.#log("Service started");
  }

  async stop() {
    this.#log("Stopping...");
    if (!!this.graceful && !!this.bree) this.graceful.stopBree(this.bree, 0);
    this.bree = null;
    this.graceful = null;
    this.#log("Service stopped");
  }

  /** @returns {import("@mintplex-labs/bree").Job[]} */
  jobs(enableDocSync = false) {
    const jobs = [
      {
        name: "process-agent-tasks",
        interval: "1m",
      },
      {
        name: "process-tasks",
        interval: "5s",
      },
    ];

    if (enableDocSync) {
      jobs.push({
        name: "sync-watched-documents",
        interval: "1hr",
      });
    }

    return jobs;
  }

  onError(error, _workerMetadata) {
    this.logger.error(`${error.message}`, {
      service: "bg-worker",
      origin: error.name,
    });
  }

  onWorkerMessageHandler(message, _workerMetadata) {
    this.logger.info(`${message.message}`, {
      service: "bg-worker",
      origin: message.name,
    });
  }
}

module.exports.BackgroundService = BackgroundService;
