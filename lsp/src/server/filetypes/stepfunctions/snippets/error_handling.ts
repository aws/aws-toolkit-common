export const errorHandling = [
    {
        name: 'Retry',
        body: [
            '"Retry": [',
            '\t{',
            '\t\t"ErrorEquals": [',
            '\t\t\t"ErrorA",',
            '\t\t\t"ErrorB"',
            '\t\t],',
            '\t\t"IntervalSeconds": 1,',
            '\t\t"BackoffRate": 2,',
            '\t\t"MaxAttempts": 2',
            '\t},',
            '\t{',
            '\t\t"ErrorEquals": [',
            '\t\t\t"ErrorC"',
            '\t\t],',
            '\t\t"IntervalSeconds": 5',
            '\t}',
            ']'
        ],
        description: 'Code snippet for a Retry field.\n\nUse a Retry field to retry a task state after an error occurs.'
    },
    {
        name: 'Catch',
        body: [
            '"Catch": [',
            '\t{',
            '\t\t"ErrorEquals": [',
            '\t\t\t"${2:States.ALL}"',
            '\t\t],',
            '\t\t"Next": "${1:NextState}"',
            '\t}',
            ']'
        ],
        description:
            'Code snippet for a Catch field.\n\nUse a Catch field to catch errors and revert to a fallback state.'
    }
]
