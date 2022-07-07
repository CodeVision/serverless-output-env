import Resolver from './lib/resolver.js';

export default class GetEnvPlugin {
  constructor(serverless) {
    this.serverless = serverless;

    this.hooks = {
      intialize: () => this.init(),
      "get-env:collect": () => this.collectVariables(),
      "get-env:resolve": () => this.resolveVariables()
    }

    this.commands = {
      'get-env': {
        lifecycleEvents: ['collect', 'resolve']
      }
    }
  }

  init() {
    console.log(`Serverless instance: ${this.serverless}`);
  }

  async collectVariables() {
    const customs = this.serverless.service.custom;
    const customStageVars = customs?.['get-env']?.outputs?.[this.serverless.service.provider.stage];

    const globalEnvVars = this.serverless.service.provider.environment || {};

    const functions = this.serverless.service.functions;
    let functionEnvVars = {};
    for (const functionName in functions) {
      const func = functions[functionName];
      functionEnvVars = { ...functionEnvVars, ...func.environment };
    };

    this.environmentVariables = { ...customStageVars, ...globalEnvVars, ...functionEnvVars };
  }

  async resolveVariables() {
    return new Resolver(this.serverless).resolve(this.environmentVariables);
  }
}
