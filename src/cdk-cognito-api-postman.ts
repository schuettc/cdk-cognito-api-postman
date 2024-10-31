import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { CognitoConstruct } from './constructs/cognito-construct';
import { LambdaConstruct } from './constructs/lambda-construct';

export class CdkCognitoApiPostmanStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool and Client
    const cognitoConstruct = new CognitoConstruct(this, 'CognitoAuth');

    // Create Lambda Function
    const lambdaConstruct = new LambdaConstruct(this, 'ApiLambda');

    // Create API Gateway with Cognito Authorizer
    new ApiGatewayConstruct(this, 'ApiGateway', {
      userPool: cognitoConstruct.userPool,
      lambdaFunction: lambdaConstruct.function,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new CdkCognitoApiPostmanStack(app, 'CdkCognitoApiPostmanStack', {
  env: devEnv,
});

app.synth();
