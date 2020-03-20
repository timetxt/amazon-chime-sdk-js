## EduClassroom

### Cloud9 deploy

#### Create an AWS Cloud9 environment

1. Go to the [AWS Cloud9 Dashboard](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1).
2. Press the **Create environment** button or go [here](https://us-east-1.console.aws.amazon.com/cloud9/home/create).
3. For the Name enter `<YourName>VideoHelpDesk` and press the **Next step** button.
4. For **Environment Settings** use the defaults and press the **Next step** button.
5. Review the **Environment name and settings** and press the **Create environment** button.
6. Wait for the environment to start.

#### Run the deployment script

Once the Cloud9 environment starts, run the following commands in the Terminal pane at the bottom of the window to download the application repository:

```
git clone https://github.com/aws/amazon-chime-sdk-js.git
cd amazon-chime-sdk-js
git checkout edu-demo
cd demos/edu-demo
```

Now in the same Terminal, run the following command to deploy, package, and create a distribution for your application. Note this will take about 15 minutes.

```
script/deploy.js -s <unique stack name>
```

At the end of the script you will see a URL to a download page. Save this link.

### Local development

First deploy the stack:

```bash
script/deploy.js -s <stack-name>
```

Note the URL when the deployment finishes, this will have a link to download the clients. To continue development locally use:

```bash
yarn dev
```
