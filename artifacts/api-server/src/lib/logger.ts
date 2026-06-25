export const logger = {
  info: (msg: string, obj?: any) => console.log(msg, obj ?? ""),
  error: (msg: string, obj?: any) => console.error(msg, obj ?? ""),
  debug: (msg: string, obj?: any) => console.log(msg, obj ?? ""),
  warn: (msg: string, obj?: any) => console.warn(msg, obj ?? ""),
};
