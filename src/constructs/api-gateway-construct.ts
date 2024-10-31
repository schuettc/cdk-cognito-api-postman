import { Duration } from "aws-cdk-lib";
import {
  RestApi,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface ApiGatewayConstructProps {
  userPool: UserPool;
  lambdaFunction: Function;
}

export class ApiGatewayConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create API Gateway
    const api = new RestApi(this, "ProtectedApi", {
      restApiName: "Protected API Demo",
      description: "API Gateway with Cognito authorization",
    });

    // Create Cognito Authorizer with explicit token configuration
    const authorizer = new CognitoUserPoolsAuthorizer(this, "ApiAuthorizer", {
      cognitoUserPools: [props.userPool],
      authorizerName: "CognitoAuthorizer",
      identitySource: "method.request.header.Authorization", // Specify where to look for the token
      resultsCacheTtl: Duration.minutes(5), // Optional: cache authorization results
    });

    // Create API Resource and Method with explicit token configuration
    const resource = api.root.addResource("hello");
    resource.addMethod("GET", new LambdaIntegration(props.lambdaFunction), {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
      authorizationScopes: ["email", "openid", "profile"], // Match the scopes from your Cognito client
    });
  }
}
