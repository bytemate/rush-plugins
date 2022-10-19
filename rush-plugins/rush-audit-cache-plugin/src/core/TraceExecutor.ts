import { BaseTraceExecutor, IBaseTraceExecutorOptions } from "./base/BaseTraceExecutor";
import * as os from 'os';
import { Import } from "@rushstack/node-core-library";

const LinuxTraceExecutorModule: typeof import('./Linux/LinuxTraceExecutor') = Import.lazy("./Linux/TraceRunner", require);

export class TraceExecutorFactory {

  private constructor() { }

  public static create(options: IBaseTraceExecutorOptions): BaseTraceExecutor {
    const platform: NodeJS.Platform = os.platform();
    switch (platform) {
      case 'linux': {
        return new LinuxTraceExecutorModule.LinuxTraceExecutor(options);
      }
      default: {
        throw new Error(`Unsupported OS platform: ${platform}, only linux is supported now.`);
      }
    }
  }

}