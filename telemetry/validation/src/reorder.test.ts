import { validate } from './validation'
import { TelemetryDefinitions } from './telemetryDefinitions'
import { reorder } from './reorder'

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

function createUnorderedData(): TelemetryDefinitions {
    const unsortedData: TelemetryDefinitions = {
        types: [{ name: 'banana' }, { name: 'apple' }],
        metrics: [{ name: 'zzz' }, { name: 'aaa' }]
    }

    return unsortedData
}
