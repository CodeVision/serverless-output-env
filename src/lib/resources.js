export const getResources = async (AWS, basicProperties) => {
  const resources = await AWS.request('CloudFormation', 'listStackResources', {
    StackName: basicProperties.stackName,
  });
  return resources.StackResourceSummaries;
}

export const getBaseParameters = (serverless, basicAWSProperties) => {
  return {
    "AWS::Region": basicAWSProperties.region,
    "AWS::Partition": basicAWSProperties.partition,
    "AWS::AccountId": basicAWSProperties.accountId,
    "Stage": serverless.service.provider.stage,
    "AWS::StackId": basicAWSProperties,
  };
}

export const getBasicAWSProperties = async serverless => {
  const region = serverless.service.provider.region;
  return {
    region,
    partition: getPartition(region),
    accountId: await serverless.providers.aws.getAccountId(),
    stage: serverless.service.provider.stage,
    stackName: serverless.providers.aws.naming.getStackName(),
  };
}

const getPartition = region => {
  if (/us-gov-.*/.test(region)) {
    return "aws-us-gov";
  } else if (/cn-.*/.test(region)) {
    return "aws-cn";
  }
  return "aws";
}
