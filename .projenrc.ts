import { awscdk } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';
import {
  NodePackageManager,
  UpgradeDependenciesSchedule,
} from 'projen/lib/javascript';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.118.0',
  license: 'MIT-0',
  copyrightOwner: 'Court Schuett',
  appEntrypoint: 'cdk-cognito-api-postman.ts',
  jest: false,
  packageManager: NodePackageManager.YARN_CLASSIC,
  projenrcTs: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  autoApproveUpgrades: true,
  defaultReleaseBranch: 'main',
  name: 'cdk-cognito-api-postman',
  devDeps: ['@aws-sdk/client-sts', '@aws-sdk/client-sso-oidc'],
  deps: ['dotenv'],
});

project.addTask('launch', {
  exec: 'yarn cdk deploy --require-approval never',
});

project.tsconfigDev.file.addOverride('include', [
  'src/**/*.ts',
  'site/**/*.ts',
  'site/**/*.tsx',
  './.projenrc.ts',
]);

project.eslint!.addOverride({
  files: ['src/resources/**/*.ts'],
  rules: {
    'indent': 'off',
    '@typescript-eslint/indent': 'off',
  },
});

project.eslint!.addOverride({
  files: ['src/resources/**/*.ts', 'src/*.ts'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
});

const common_exclude = [
  'docker-compose.yaml',
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
  '.env',
  '**/dist/**',
  '**/bin/**',
  '**/lib/**',
  'config.json',
];

const cdkDeploy = project.github!.addWorkflow('cdk-deploy');
cdkDeploy.on({
  push: { branches: ['main'] },
  pullRequest: { branches: ['main'], types: ['closed'] },
});

cdkDeploy.addJobs({
  deploy: {
    runsOn: ['ubuntu-latest'],
    name: 'Deploy CDK Stack',
    permissions: {
      actions: JobPermission.WRITE,
      contents: JobPermission.READ,
      idToken: JobPermission.WRITE,
    },
    if: "github.event.pull_request.merged == true || github.event_name == 'push'",
    steps: [
      { uses: 'actions/checkout@v4' },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': '18',
        },
      },
      { run: 'yarn install --frozen-lockfile' },
      {
        name: 'Configure AWS Credentials',
        uses: 'aws-actions/configure-aws-credentials@v4',
        with: {
          'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
          'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
          'aws-region': 'us-east-1',
          'role-session-name': 'GitHubActionsCDKDeploy',
        },
      },
      {
        name: 'CDK Diff',
        run: 'npx cdk diff',
      },
      {
        name: 'CDK Deploy',
        run: 'npx cdk deploy --all --require-approval never',
      },
    ],
  },
});

project.gitignore.exclude(...common_exclude);
project.synth();
