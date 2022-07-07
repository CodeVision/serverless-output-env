import NodeEvaluator from 'cfn-resolver-lib';

import { getBasicAWSProperties, getBaseParameters, getResources } from './resources.js';

export default class Resolver {
  constructor(serverless) {
    this.serverless = serverless;
  }

  async resolve(variables) {
    const basicAWSProperties = await getBasicAWSProperties(this.serverless);
    const baseParameters = getBaseParameters(this.serverless, basicAWSProperties);

    const resources = await getResources(this.serverless.providers.aws, basicAWSProperties);

    const evaluator = new NodeEvaluator(Object.assign({ Parameters: [] }, variables), {
      RefResolvers: {
        ...baseParameters,
        ...this.getRefResolvers(resources),
      },
      "Fn::GetAttResolvers": this.getAttributeResolvers(resources, basicAWSProperties)
    });
    const result = evaluator.evaluateNodes();
    console.log(result);
  }

  getRefResolvers(resources) {
    const result = {};
    for (const resource of resources) {
      result[resource.LogicalResourceId] = resource.PhysicalResourceId;
    }

    return result;
  }


  getAttributeResolvers(resources, basicAWSProperties) {
    const result = {};
    for (const resource of resources) {
      result[resource.LogicalResourceId] = resolveAttributes(resource, basicAWSProperties);
    }

    return result;
  }
}

const resolveAttributes = (resource, awsProperties) => {
  const { region, accountId } = awsProperties;
  switch (resource.ResourceType) {
    case "AWS::Events::EventBus": 
      return {
        Arn: `arn:aws:events:${region}:${accountId}:event-bus/${resource.PhysicalResourceId}`,
        Name: resource.PhysicalResourceId
      };
    case "AWS::Events::Rule":
      return {
        Arn: `arn:aws:events:${region}:${accountId}:rule/${resource.PhysicalResourceId}`,
      };
    case "AWS::SQS::Queue":
      const queueName = resource.PhysicalResourceId.substring(resource.PhysicalResourceId.lastIndexOf('/') + 1);
      return {
        Arn: `arn:aws:sqs:${region}:${accountId}:${queueName}`,
        QueueName: queueName,
      };
    case "AWS::Lambda::Function":
      return {
        Arn: `arn:aws:lambda:${region}:${accountId}:function:${resource.PhysicalResourceId}`
      };
    case "AWS::ApiGatewayV2::Api":
      return {
        ApiEndpoint: `https://${resource.PhysicalResourceId}.execute-api.${region}.amazonaws.com`
      };
    case "AWS::Logs::LogGroup":
      return {
        Arn: `arn:aws:logs:${region}:${accountId}:log-group:/${resource.PhysicalResourceId}:*`
      };
    default:
      return {};
  }
};
