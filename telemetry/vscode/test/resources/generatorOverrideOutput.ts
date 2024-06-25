/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
export interface MetricBase {
    /** The result of the operation */
    readonly result?: Result
    /** Reason code or name for an event (when result=Succeeded) or error (when result=Failed). Unlike the `reasonDesc` field, this should be a stable/predictable name for a class of events or errors (typically the exception name, e.g. FileIOException). */
    readonly reason?: string
    /** Error message detail. May contain arbitrary message details (unlike the `reason` field), but should be truncated (recommendation: 200 chars). */
    readonly reasonDesc?: string
    /** The duration of the operation in miliseconds */
    readonly duration?: number
    /** A flag indicating that the metric was not caused by the user. */
    readonly passive?: boolean
    /** @deprecated Arbitrary "value" of the metric. */
    readonly value?: number
}

export interface MetadataHasResult extends MetricBase {}

export type Result = 'Succeeded'
export type LambdaRuntime = 'dotnetcore2.1' | 'nodejs12.x'

export interface MetricDefinition {
    readonly unit: string
    readonly passive: boolean
    readonly requiredMetadata: readonly string[]
}

export interface MetricShapes {
    readonly metadata_hasResult: MetadataHasResult
}

export type MetricName = keyof MetricShapes

export const definitions: Record<string, MetricDefinition> = {
    metadata_hasResult: { unit: 'None', passive: false, requiredMetadata: [] },
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
    /** It does not actually have a result, yep */
    public get metadata_hasResult(): Metric<MetadataHasResult> {
        return this.getMetric('metadata_hasResult')
    }

    protected abstract getMetric(name: string): Metric
}
