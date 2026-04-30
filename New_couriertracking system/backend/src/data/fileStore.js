import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, "../../data");
const dataFilePath = path.join(dataDirectory, "store.json");

const initialStore = {
  users: [],
  shipments: []
};

let operationQueue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureStoreFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.writeFile(dataFilePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
};

const withStore = async (handler) => {
  const run = async () => {
    await ensureStoreFile();
    const rawStore = await fs.readFile(dataFilePath, "utf8");
    const store = rawStore ? JSON.parse(rawStore) : clone(initialStore);
    const result = await handler(store);

    if (result?.write) {
      await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
    }

    return result?.value;
  };

  const nextOperation = operationQueue.then(run, run);
  operationQueue = nextOperation.catch(() => undefined);
  return nextOperation;
};

export const readStore = async (reader) =>
  withStore(async (store) => ({
    value: clone(await reader(store)),
    write: false
  }));

export const writeStore = async (writer) =>
  withStore(async (store) => ({
    value: clone(await writer(store)),
    write: true
  }));

