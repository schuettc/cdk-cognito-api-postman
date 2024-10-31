import { RemovalPolicy, CfnOutput, Duration, Stack } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  OAuthScope,
  UserPoolClientIdentityProvider,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CognitoConstruct extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly userPoolDomain: UserPoolDomain;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Get stack name and create unique domain prefix
    const stack = Stack.of(this);
    const randomSuffix = Math.random().toString(36).substring(2, 8); // Generate random 6-character string
    const uniqueDomainPrefix = `${stack.stackName.toLowerCase()}-${
      stack.region
    }-${randomSuffix}`
      .substring(0, 63) // Domain prefix has a max length of 63 characters
      .replace(/[^a-z0-9-]/g, "-") // Replace invalid characters with hyphens
      .replace(/cognito/g, "auth"); // Replace any instance of 'cognito' with 'auth'

    // Create User Pool
    this.userPool = new UserPool(this, "UserPool", {
      userPoolName: "postman-demo-user-pool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      // Enhanced email configuration
      userVerification: {
        emailStyle: VerificationEmailStyle.LINK,
        emailSubject: "Verify your email for our demo app!",
        emailBody:
          "Thanks for signing up! Click the link below to verify your email {##Verify Email##}",
      },
      // Sign-in customization
      signInCaseSensitive: false, // case insensitive email login
    });

    // Create Cognito Domain with unique prefix
    this.userPoolDomain = this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: uniqueDomainPrefix,
      },
    });

    // Create User Pool Client
    this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:3000/callback",
          "https://oauth.pstmn.io/v1/callback", // For Postman testing
        ],
        logoutUrls: ["http://localhost:3000/logout"],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      generateSecret: false,
      // Additional UI customization
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      refreshTokenValidity: Duration.days(30),
    });

    // Outputs for testing
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "CognitoDomainUrl", {
      value: this.userPoolDomain.baseUrl(),
    });

    new CfnOutput(this, "HostedUISignUpUrl", {
      value: `${this.userPoolDomain.baseUrl()}/signup?client_id=${
        this.userPoolClient.userPoolClientId
      }&response_type=code&scope=email+openid+profile&redirect_uri=https://oauth.pstmn.io/v1/callback`,
    });

    new CfnOutput(this, "AuthURL", {
      value: `${this.userPoolDomain.baseUrl()}/oauth2/authorize`,
    });

    new CfnOutput(this, "TokenURL", {
      value: `${this.userPoolDomain.baseUrl()}/oauth2/token`,
    });
  }
}
