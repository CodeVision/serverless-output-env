import Resolver from './lib/resolver.js';

import { writeFile } from 'fs/promises';

export default class GetEnvPlugin {
  constructor(serverless, options, { log }) {
    this.serverless = serverless;
    this.options = options;
    this.log = log;

    this.hooks = {
      intialize: () => this.init(),
      'before:output-env:output': async () => {
        await this.collectVariables();
        await this.resolveVariables();
        await this.prepareOutput();
      },
      'output-env:output': () => this.outputVariables()
    }

    this.commands = {
      'output-env': {
        usage: 'Get the environment and custom variables defined in the serverless.yml',
        lifecycleEvents: ['output'],
        options: {
          outputFile: {
            usage: 'Specify the file you want to write the output to',
            shortcut: 'o',
            type: 'string',
            default: '.env'
          },
          print: {
            usage: 'Print the variables to the command line instead of writing to a file',
            shortcut: 'p',
            type: 'boolean',
            default: false
          }
        }
      }
    }
  }

  init() {
    console.log(`Serverless instance: ${this.serverless}`);
  }

  async collectVariables() {
    const customs = this.serverless.service.custom?.['output-env'];

    let customStageVars = {};
    if (customs) {
      const stage = this.serverless.service.provider.stage;

      const defaults = customs.variables?.default;
      const stageVars = customs.variables?.[stage];

      if (stage === 'prod' && !customs.useDefaultForProduction) {
        customStageVars = { ...stageVars };
      } else {
        customStageVars = { ...defaults, ...stageVars };
      }
    }

    const globalEnvVars = this.serverless.service.provider.environment || {};

    const functions = this.serverless.service.functions;
    let functionEnvVars = {};
    for (const functionName in functions) {
      const func = functions[functionName];
      functionEnvVars = { ...functionEnvVars, ...func.environment };
    };

    this.environmentVariables = { raw: { ...customStageVars, ...globalEnvVars, ...functionEnvVars }};
  }

  async resolveVariables() {
    const resolver = new Resolver(this.serverless);
    this.environmentVariables.resolved = await resolver.resolve(this.environmentVariables.raw);
  }

  async prepareOutput() {
    this.preparedOutput = Object.entries(this.environmentVariables.resolved).map(([key, value]) => {
      return `${key}=${value}`;
    }).join('\n');
  }

  async outputVariables() {
    if (this.options.print) {
      this.log.info(this.preparedOutput);
    } else {
      await writeOutputFile(this.preparedOutput, this.options.outputFile);
    }
  }
}

const writeOutputFile = async (output, file) => {
  try {
    await writeFile(file, output);
  } catch {
    this.log.error(`Error writing output to file: ${file}`);
  }
};
