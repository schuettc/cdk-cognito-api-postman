import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LambdaConstruct extends Construct {
  public readonly function: Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.function = new Function(this, 'ApiHandler', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async function(event, context) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Hello from protected API!',
              cognitoUser: event.requestContext.authorizer.claims,
            }),
          };
        };
      `),
    });
  }
}
