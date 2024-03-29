import Resolver from './lib/resolver.js';

import { writeFile } from 'fs/promises';

const PLUGIN_NAME = 'output-env';
const PRODUCTION_STAGE_NAME = 'prod';

export default class OutputEnvPlugin {
  constructor(serverless, options, { log }) {
    this.serverless = serverless;
    this.options = options;
    this.log = log;

    this.hooks = {
      intialize: () => this.init(),
      [`before:${PLUGIN_NAME}:output`]: async () => {
        await this.collectVariables();
        await this.resolveVariables();
        await this.prepareOutput();
      },
      [`${PLUGIN_NAME}:output`]: () => this.outputVariables()
    }

    const commandOptions = {
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
          }
        }
      };

    this.commands = {
      [capitalize(PLUGIN_NAME)]: commandOptions,
      [PLUGIN_NAME]: commandOptions
    }
  }

  init() {
    console.log(`Serverless instance: ${this.serverless}`);
  }

  async collectVariables() {
    const customs = this.serverless.service.custom?.[capitalize(PLUGIN_NAME)];

    let customStageVars = {};
    if (customs) {
      const stage = this.options.stage || this.serverless.service.provider.stage;

      const defaults = customs.localVariables?.default;
      const stageVars = customs.localVariables?.[stage];

      if (stage === PRODUCTION_STAGE_NAME && !customs.useDefaultForProduction) {
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

    this.environmentVariables = { raw: { ...globalEnvVars, ...functionEnvVars, ...customStageVars }};
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
      this.log.notice(this.preparedOutput);
    } else {
      await writeOutputFile(this.preparedOutput, this.options.outputFile);
    }
  }
}

const capitalize = name => {
  return name.split(/[-_]+/)
    .map((value, index) => index !== 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value )
    .join('');
}

const writeOutputFile = async (output, file) => {
  try {
    await writeFile(file, output);
  } catch {
    this.log.error(`Error writing output to file: ${file}`);
  }
};
