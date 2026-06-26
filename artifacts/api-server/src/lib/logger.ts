export const logger = {
  info: (msg: any, obj?: any) => console.log(typeof msg === "string" ? msg : JSON.stringify(msg), obj ? JSON.stringify(obj) : ""),
  error: (msg: any, obj?: any) => console.error(typeof msg === "string" ? msg : JSON.stringify(msg), obj ? JSON.stringify(obj) : ""),
  debug: (msg: any, obj?: any) => console.log(typeof msg === "string" ? msg : JSON.stringify(msg), obj ? JSON.stringify(obj) : ""),
  warn: (msg: any, obj?: any) => console.warn(typeof msg === "string" ? msg : JSON.stringify(msg), obj ? JSON.stringify(obj) : ""),
};
