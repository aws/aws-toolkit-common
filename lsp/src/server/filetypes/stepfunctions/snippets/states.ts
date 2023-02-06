export const states = [
    {
        name: 'Pass State',
        body: [
            '"${1:PassState}": {',
            '\t"Type": "Pass",',
            '\t"Result": {',
            '\t\t"data1": 0.5,',
            '\t\t"data2": 1.5',
            '\t},',
            '\t"ResultPath": "$.result",',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for a Pass state.\n\nA Pass state passes its input to its output, without performing work.'
    },
    {
        name: 'Lambda Task State',
        body: [
            '"${1:Invoke Lambda function}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::lambda:invoke",',
            '\t"Parameters": {',
            '\t\t"FunctionName": "${3:arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME}",',
            '\t\t"Payload": {',
            '\t\t\t"Input.$": "$"',
            '\t\t}',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description: 'Code snippet for a Lambda Task state.\n\nCalls the AWS Lambda Invoke API to invoke a function.'
    },
    {
        name: 'EventBridge Task State',
        body: [
            '"${1:Send an EventBridge custom event}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::events:putEvents",',
            '\t"Parameters": {',
            '\t\t"Entries": [',
            '\t\t\t{',
            '\t\t\t\t"Detail": {',
            '\t\t\t\t\t"Message": "${4:Hello from Step Functions!}"',
            '\t\t\t\t},',
            '\t\t\t\t"DetailType": "${5:MyDetailType}",',
            '\t\t\t\t"EventBusName": "${6:MyEventBusName}",',
            '\t\t\t\t"Source": "${7:MySource}"',
            '\t\t\t}',
            '\t\t]',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for an EventBridge Task state.\n\nCalls the Amazon EventBridge PutEvents API to send a custom event to an event bus.'
    },
    {
        name: 'SNS Task State',
        body: [
            '"${1:Send message to SNS}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::sns:publish",',
            '\t"Parameters": {',
            '\t\t"TopicArn": "${3:arn:aws:sns:REGION:ACCOUNT_ID:myTopic}",',
            '\t\t"Message": {',
            '\t\t\t"Input": "${4:Hello from Step Functions!}"',
            '\t\t}',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for an SNS Publish Task state.\n\nCalls the Amazon SNS Publish API to send a message to a destination.'
    },
    {
        name: 'Batch Task State',
        body: [
            '"${1:Manage Batch task}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::batch:submitJob.sync",',
            '\t"Parameters": {',
            '\t\t"JobDefinition": "${3:arn:aws:batch:REGION:ACCOUNT_ID:job-definition/testJobDefinition}",',
            '\t\t"JobName": "${4:myJobName}",',
            '\t\t"JobQueue": "${5:arn:aws:batch:REGION:ACCOUNT_ID:job-queue/testQueue}"',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for a Batch job Task state.\n\nCalls the AWS Batch SubmitJob API and resumes the execution once the job is complete.'
    },
    {
        name: 'ECS Task State',
        body: [
            '"${1:Manage ECS task}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::ecs:runTask.sync",',
            '\t"Parameters": {',
            '\t\t"LaunchType": "FARGATE",',
            '\t\t"Cluster": "${3:arn:aws:ecs:REGION:ACCOUNT_ID:cluster/MyECSCluster}",',
            '\t\t"TaskDefinition": "${4:arn:aws:ecs:REGION:ACCOUNT_ID:task-definition/MyTaskDefinition:1}"',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for an ECS RunTask Task state.\n\nCalls the Amazon ECS RunTask API and resumes the execution once the ECS task is complete.'
    },
    {
        name: 'SQS Task State',
        body: [
            '"${1:Send message to SQS}": {',
            '\t"Type": "Task",',
            '\t"Resource": "arn:aws:states:::sqs:sendMessage",',
            '\t"Parameters": {',
            '\t\t"QueueUrl": "${3:https://sqs.REGION.amazonaws.com/ACCOUNT_ID/myQueue}",',
            '\t\t"MessageBody": {',
            '\t\t\t"Input": "${4:Hello from Step Functions!}"',
            '\t\t}',
            '\t},',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for an SQS Publish Task state.\n\nCalls the Amazon SQS SendMessage API to send a message to a queue.'
    },
    {
        name: 'Choice State',
        body: [
            '"${1:ChoiceState}": {',
            '\t"Type": "Choice",',
            '\t"Choices": [',
            '\t\t{',
            '\t\t\t"Variable": "$.${2:variable}",',
            '\t\t\t"BooleanEquals": true,',
            '\t\t\t"Next": "TrueState"',
            '\t\t},',
            '\t\t{',
            '\t\t\t"Variable": "$.${2:variable}",',
            '\t\t\t"BooleanEquals": false,',
            '\t\t\t"Next": "FalseState"',
            '\t\t}',
            '\t],',
            '\t"Default": "${3:DefaultState}"',
            '}'
        ],
        description: 'Code snippet for a Choice state.\n\nA Choice state adds branching logic to a state machine.'
    },
    {
        name: 'Wait State',
        body: ['"${1:WaitState}": {', '\t"Type": "Wait",', '\t"Seconds": 10,', '\t"Next": "${2:NextState}"', '}'],
        description:
            'Code snippet for a Wait state.\n\nA Wait state delays the state machine from continuing for a specified time.'
    },
    {
        name: 'Succeed State',
        body: ['"${1:SuccessState}": {', '\t"Type": "Succeed"', '}'],
        description: 'Code snippet for a Succeed state.\n\nA Succeed state stops an execution successfully.'
    },
    {
        name: 'Fail State',
        body: [
            '"${1:FailState}": {',
            '\t"Type": "Fail",',
            '\t"Cause": "${2:Invalid response.}",',
            '\t"Error": "${3:ErrorA}"',
            '}'
        ],
        description:
            'Code snippet for a Fail state.\n\nA Fail state stops the execution of the state machine and marks it as a failure.'
    },
    {
        name: 'Parallel State',
        body: [
            '"${1:ParallelState}": {',
            '\t"Type": "Parallel",',
            '\t"Branches": [',
            '\t\t{',
            '\t\t\t"StartAt": "State1",',
            '\t\t\t"States": {',
            '\t\t\t\t"State1": {',
            '\t\t\t\t\t"Type": "Pass",',
            '\t\t\t\t\t"End": true',
            '\t\t\t\t}',
            '\t\t\t}',
            '\t\t},',
            '\t\t{',
            '\t\t\t"StartAt": "State2",',
            '\t\t\t"States": {',
            '\t\t\t\t"State2": {',
            '\t\t\t\t\t"Type": "Pass",',
            '\t\t\t\t\t"End": true',
            '\t\t\t\t}',
            '\t\t\t}',
            '\t\t}',
            '\t],',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for a Parallel state.\n\nA Parallel state can be used to create parallel branches of execution in your state machine.'
    },
    {
        name: 'Map State',
        body: [
            '"${1:MapState}": {',
            '\t"Type": "Map",',
            '\t"ItemsPath": "$.array",',
            '\t"MaxConcurrency": 0,',
            '\t"Iterator": {',
            '\t\t"StartAt": "Pass",',
            '\t\t"States": {',
            '\t\t\t"Pass": {',
            '\t\t\t\t"Type": "Pass",',
            '\t\t\t\t"Result": "Done!",',
            '\t\t\t\t"End": true',
            '\t\t\t}',
            '\t\t}',
            '\t},',
            '\t"ResultPath": "$.output",',
            '\t"Next": "${2:NextState}"',
            '}'
        ],
        description:
            'Code snippet for a Map state.\n\nThe Map state can be used to run a set of steps for each element of an input array. While the Parallel state executes multiple branches of steps using the same input, a Map state will execute the same steps for multiple entries of an array in the state input.'
    }
]
