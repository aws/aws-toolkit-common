/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
export interface MetricBase {
    /** The result of the operation */
    readonly result?: Result
    /** The reason for a metric or exception depending on context */
    readonly reason?: string
    /** The duration of the operation in miliseconds */
    readonly duration?: number
    /** A flag indicating that the metric was not caused by the user. */
    readonly passive?: boolean
    /** @deprecated Arbitrary "value" of the metric. */
    readonly value?: number
}

export interface TestMetric extends MetricBase {
    /** A test object for parsing allowedValues */
    readonly testAllowedValues: TestAllowedValues
}

export type Result = 'Succeeded'
export type LambdaRuntime = 'dotnetcore2.1' | 'nodejs12.x'
export type TestAllowedValues = 'test spaces are replaced' | 'in allowed values output key'

export interface MetricDefinition {
    readonly unit: string
    readonly passive: boolean
    readonly requiredMetadata: readonly string[]
}

export interface MetricShapes {
    readonly test_metric: TestMetric
}

export type MetricName = keyof MetricShapes

export const definitions: Record<string, MetricDefinition> = {
    test_metric: { unit: 'None', passive: false, requiredMetadata: ['testAllowedValues'] },
}

export type Metadata<T extends MetricBase> = Partial<Omit<T, keyof MetricBase>>

export interface Metric<T extends MetricBase = MetricBase> {
    readonly name: string
    /** Adds data to the metric which is preserved for the remainder of the execution context */
    record(data: Metadata<T>): void
    /** Sends the metric to the telemetry service */
    emit(data?: T): void
    /** Executes a callback, automatically sending the metric after completion */
    run<U>(fn: (span: this) => U): U
}

export abstract class TelemetryBase {
    /** A test for defining allowedValues */
    public get test_metric(): Metric<TestMetric> {
        return this.getMetric('test_metric')
    }

    protected abstract getMetric(name: string): Metric
}
