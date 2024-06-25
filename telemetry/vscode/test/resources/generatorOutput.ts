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

export interface LambdaDelete extends MetricBase {
    /** a test boolean type */
    readonly booltype: boolean
}

export interface LambdaCreate extends MetricBase {
    /** The lambda runtime */
    readonly lambdaRuntime: LambdaRuntime
    /** untyped string type */
    readonly arbitraryString: string
}

export interface LambdaRemoteinvoke extends MetricBase {
    /** The lambda runtime */
    readonly lambdaRuntime?: LambdaRuntime
    /** a test int type */
    readonly inttype: number
}

export interface NoMetadata extends MetricBase {}

export interface PassivePassive extends MetricBase {}

export type Result = 'Succeeded'
export type LambdaRuntime = 'dotnetcore2.1' | 'nodejs12.x'

export interface MetricDefinition {
    readonly unit: string
    readonly passive: boolean
    readonly requiredMetadata: readonly string[]
}

export interface MetricShapes {
    readonly lambda_delete: LambdaDelete
    readonly lambda_create: LambdaCreate
    readonly lambda_remoteinvoke: LambdaRemoteinvoke
    readonly no_metadata: NoMetadata
    readonly passive_passive: PassivePassive
}

export type MetricName = keyof MetricShapes

export const definitions: Record<string, MetricDefinition> = {
    lambda_delete: { unit: 'None', passive: false, requiredMetadata: ['booltype'] },
    lambda_create: { unit: 'None', passive: false, requiredMetadata: ['lambdaRuntime', 'arbitraryString'] },
    lambda_remoteinvoke: { unit: 'None', passive: false, requiredMetadata: ['inttype'] },
    no_metadata: { unit: 'None', passive: false, requiredMetadata: [] },
    passive_passive: { unit: 'None', passive: true, requiredMetadata: [] },
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
    /** called when deleting lambdas remotely */
    public get lambda_delete(): Metric<LambdaDelete> {
        return this.getMetric('lambda_delete')
    }

    /** called when creating lambdas remotely */
    public get lambda_create(): Metric<LambdaCreate> {
        return this.getMetric('lambda_create')
    }

    /** called when invoking lambdas remotely */
    public get lambda_remoteinvoke(): Metric<LambdaRemoteinvoke> {
        return this.getMetric('lambda_remoteinvoke')
    }

    /** called when invoking lambdas remotely */
    public get no_metadata(): Metric<NoMetadata> {
        return this.getMetric('no_metadata')
    }

    /** a passive metric */
    public get passive_passive(): Metric<PassivePassive> {
        return this.getMetric('passive_passive')
    }

    protected abstract getMetric(name: string): Metric
}
