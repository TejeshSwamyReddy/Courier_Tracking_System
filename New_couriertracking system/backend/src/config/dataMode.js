const dataMode = process.env.DATA_MODE || (process.env.MONGODB_URI ? "mongo" : "file");

export const isMongoMode = dataMode === "mongo";
export default dataMode;

