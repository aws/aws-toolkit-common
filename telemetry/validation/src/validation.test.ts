import { validate } from './validation'
import { TelemetryDefinitions } from './telemetryDefinitions'

test('valid definition', () => {
    const data: TelemetryDefinitions = {
        types: [{ name: 'apple' }, { name: 'banana' }],
        metrics: [{ name: 'aaa' }, { name: 'zzz' }]
    }

    const validations = validate(data)
    expect(validations).toHaveLength(0)
})

test('flag unsorted fields', () => {
    const data: TelemetryDefinitions = {
        types: [{ name: 'banana' }, { name: 'apple' }],
        metrics: []
    }

    const validations = validate(data)
    expect(validations).toHaveLength(1)
})

test('flag unsorted metrics', () => {
    const data: TelemetryDefinitions = {
        types: [],
        metrics: [{ name: 'zzz' }, { name: 'aaa' }]
    }

    const validations = validate(data)
    expect(validations).toHaveLength(1)
})
