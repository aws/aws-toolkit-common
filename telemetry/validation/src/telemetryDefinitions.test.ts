import { TelemetryDefinitions, reorder, validate } from './telemetryDefinitions'

test('validation passes with a valid definition', () => {
    const data: TelemetryDefinitions = {
        types: [{ name: 'apple' }, { name: 'banana' }],
        metrics: [{ name: 'aaa' }, { name: 'ggg', metadata: [{ type: 'giraffe' }, { type: 'zebra' }] }, { name: 'zzz' }]
    }

    const validations = validate(data)
    expect(validations).toHaveLength(0)
})

test('validation detects unsorted fields', () => {
    const data: TelemetryDefinitions = {
        types: [{ name: 'banana' }, { name: 'apple' }],
        metrics: []
    }

    const validations = validate(data)
    expect(validations).toHaveLength(1)
})

test('validation detects unsorted metrics', () => {
    const data: TelemetryDefinitions = {
        types: [],
        metrics: [{ name: 'zzz' }, { name: 'aaa' }]
    }

    const validations = validate(data)
    expect(validations).toHaveLength(1)
})

test('validation detects unsorted metric metadata', () => {
    const data: TelemetryDefinitions = {
        types: [],
        metrics: [{ name: 'aaa' }, { name: 'zzz', metadata: [{ type: 'zebra' }, { type: 'giraffe' }] }]
    }

    const validations = validate(data)
    expect(validations).toHaveLength(1)
})

test('reordering passes validation check', () => {
    const data: TelemetryDefinitions = createUnorderedData()

    reorder(data)
    const validations = validate(data)
    expect(validations).toHaveLength(0)
})

test('reorder types', () => {
    const data: TelemetryDefinitions = createUnorderedData()

    reorder(data)

    expect(data.types[0].name).toBe('apple')
    expect(data.types[1].name).toBe('banana')
})

test('reorder metrics', () => {
    const data: TelemetryDefinitions = createUnorderedData()

    reorder(data)

    expect(data.metrics[0].name).toBe('aaa')
    expect(data.metrics[1].name).toBe('zzz')
})

test('reorder metrics metadata', () => {
    const data: TelemetryDefinitions = {
        types: [],
        metrics: [{ name: 'aaa', metadata: [{ type: 'zebra' }, { type: 'giraffe' }] }]
    }

    reorder(data)

    expect(data.metrics[0].metadata![0].type).toBe('giraffe')
    expect(data.metrics[0].metadata![1].type).toBe('zebra')
})

function createUnorderedData(): TelemetryDefinitions {
    const unsortedData: TelemetryDefinitions = {
        types: [{ name: 'banana' }, { name: 'apple' }],
        metrics: [{ name: 'zzz' }, { name: 'aaa' }]
    }

    return unsortedData
}
