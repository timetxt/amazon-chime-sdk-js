#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require("fs");
const path = require("path");

// Parameters
let region = 'us-east-1';
let bucket = ``;
let stack = ``;
let app = `meeting`;
let useEventBridge = false;
let appName = 'EduClassroom';

function usage() {
  console.log(`Usage: setup.js -s <stack> [-r region] [-b bucket]`);
  console.log(`  -s, --stack-name   CloudFormation stack name, required`);
  console.log('Optional:');
  console.log(`  -r, --region       Target region, default '${region}'`);
  console.log(`  -b, --s3-bucket    S3 bucket for deployment, default is stack name`);
  console.log(`  -h, --help         Show help and exit`);
}

function ensureBucket(bucketName, isWebsite) {
  const s3Api = spawnSync('aws', ['s3api', 'head-bucket', '--bucket', `${bucketName}`, '--region', `${region}`]);
  if (s3Api.status !== 0) {
    console.log(`Creating S3 bucket ${bucketName}`);
    const s3 = spawnSync('aws', ['s3', 'mb', `s3://${bucketName}`, '--region', `${region}`]);
    if (s3.status !== 0) {
      console.log(`Failed to create bucket: ${JSON.stringify(s3)}`);
      console.log((s3.stderr || s3.stdout).toString());
      process.exit(s3.status)
    }
    if (isWebsite) {
      const s3Website = spawnSync('aws', ['s3', 'website', `s3://${bucketName}`, '--index-document', `index.html`, '--error-document', 'error.html']);
      if (s3Website.status !== 0) {
        console.log(`Failed to create bucket: ${JSON.stringify(s3Website)}`);
        console.log((s3Website.stderr || s3Website.stdout).toString());
        process.exit(s3Website.status)
      }
    }
  }
}

function getArgOrExit(i, args) {
  if (i >= args.length) {
    console.log('Too few arguments');
    usage();
    process.exit(1);
  }
  return args[i].trim();
}

function parseArgs() {
  var args = process.argv.slice(2);
  var i = 0;
  while (i < args.length) {
    switch(args[i]) {
      case '-h': case '--help':
        usage();
        process.exit(0);
        break;
      case '-r': case '--region':
        region = getArgOrExit(++i, args)
        break;
      case '-b': case '--s3-bucket':
        bucket = getArgOrExit(++i, args)
        break;
      case '-s': case '--stack-name':
        stack = getArgOrExit(++i, args)
        break;
      case '-e': case '--event-bridge':
        useEventBridge = true;
        break;
      default:
        console.log(`Invalid argument ${args[i]}`);
        usage();
        process.exit(1)
    }
    ++i;
  }
  if (!stack) {
    console.log('Missing required parameters');
    usage();
    process.exit(1);
  }
  if (!bucket) {
    bucket = stack;
  }
}

function spawnOrFail(command, args, options) {
  console.log(`--> ${command} ${args.join(' ')}`);
  const cmd = spawnSync(command, args, options);
  if (cmd.error) {
    console.log(`Command ${command} failed with ${cmd.error.code}`);
    process.exit(255);
  }
  const output = cmd.stdout.toString();
  console.log(output);
  if (cmd.status !== 0) {
    console.log(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
    console.log(cmd.stderr.toString());
    process.exit(cmd.status)
  }
  return output;
}

function spawnAndIgnoreResult(command, args, options) {
  console.log(`--> ${command} ${args.join(' ')}`);
  spawnSync(command, args, options);
}

function appHtml(appName) {
  return `../browser/dist/${appName}.html`
}

function setupCloud9() {
}

function ensureTools() {
  spawnOrFail('aws', ['--version']);
  spawnOrFail('sam', ['--version']);
  spawnOrFail('npm', ['install', '-g', 'yarn']);
}

function main() {
  parseArgs();
  ensureTools();

  const rootDir = __dirname + '/..';

  process.chdir(rootDir);

  spawnOrFail('script/cloud9-resize.sh', []);

  if (!fs.existsSync('amazon-chime-sdk-js')) {
    process.chdir('/tmp');
    spawnOrFail('rm', ['-rf', '/tmp/amazon-chime-sdk-js']);
    spawnOrFail('git', ['clone', '--depth', '1', 'https://github.com/aws/amazon-chime-sdk-js.git']);
    process.chdir('/tmp/amazon-chime-sdk-js');
    spawnOrFail('npm', ['run', 'build']);
    process.chdir(rootDir);
    spawnOrFail('mv', ['/tmp/amazon-chime-sdk-js', rootDir + '/amazon-chime-sdk-js']);
  }
  process.chdir(rootDir + '/serverless');

  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }

  console.log(`Using region ${region}, bucket ${bucket}, stack ${stack}`);
  ensureBucket(bucket, false);
  ensureBucket(bucket + '-releases', true);

  fs.writeFileSync('src/index.html', `
<html>
<body>
<a href="https://${bucket}-releases.s3.amazonaws.com/mac/${appName}.zip">Download ${appName} for macOS (ZIP)</a> |
<a href="https://${bucket}-releases.s3.amazonaws.com/win/${appName}.zip">Download ${appName} for Windows (ZIP)</a>
  `);

  spawnOrFail('touch', ['src/index.html', 'src/indexV2.html']);

  spawnOrFail('sam', ['package', '--s3-bucket', `${bucket}`,
                      `--output-template-file`, `build/packaged.yaml`,
                      '--region',  `${region}`]);
  console.log('Deploying serverless application');
  spawnOrFail('sam', ['deploy', '--template-file', './build/packaged.yaml', '--stack-name', `${stack}`,
                      '--parameter-overrides', `UseEventBridge=${useEventBridge}`,
                      '--capabilities', 'CAPABILITY_IAM', '--region', `${region}`]);
  const endpoint = spawnOrFail('aws', ['cloudformation', 'describe-stacks', '--stack-name', `${stack}`,
                      '--query', 'Stacks[0].Outputs[0].OutputValue', '--output', 'text', '--region', `${region}`]).trim();

  console.log(`Endpoint: ${endpoint}`);

  process.chdir(rootDir);

  fs.writeFileSync('app/utils/getBaseUrl.ts', `export default function getBaseUrl() {return '${endpoint}';}`);

  spawnOrFail('yarn', []);

  console.log ('... packaging (this may take a while) ...');
  spawnAndIgnoreResult('yarn',  ['package-mac']);
  spawnAndIgnoreResult('yarn',  ['package-win']);
  spawnOrFail('mv', ['release/win-unpacked', `release/${appName}`]);
  process.chdir(rootDir + '/release');
  spawnOrFail('zip', ['-r', appName + '-win.zip', appName]);
  process.chdir(rootDir);

  console.log ('... uploading Mac installer (this may take a while) ...');
  spawnOrFail('aws', ['s3', 'cp', '--acl', 'public-read', `release/${appName}.zip`, `s3://${bucket}-releases/mac/${appName}.zip`]);

  console.log ('... uploading Windows installer (this may take a while) ...');
  spawnOrFail('aws', ['s3', 'cp', '--acl', 'public-read', `release/${appName}-win.zip`, `s3://${bucket}-releases/win/${appName}.zip`]);

  console.log('=============================================================');
  console.log('');
  console.log('Link to download application:');
  console.log(endpoint);
  console.log('');
  console.log('=============================================================');
}

main();
