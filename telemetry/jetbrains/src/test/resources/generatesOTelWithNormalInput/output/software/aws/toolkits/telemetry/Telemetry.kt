// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import kotlin.Suppress
import software.aws.toolkits.jetbrains.services.telemetry.otel.OTelService
import software.aws.toolkits.telemetry.`impl`.LambdaTracer
import software.aws.toolkits.telemetry.`impl`.NoTracer
import software.aws.toolkits.telemetry.`impl`.PassiveTracer

public object Telemetry {
    public val lambda: LambdaTracer
        get() = LambdaTracer(OTelService.getSdk().getTracer("lambda"))

    public val no: NoTracer
        get() = NoTracer(OTelService.getSdk().getTracer("no"))

    public val passive: PassiveTracer
        get() = PassiveTracer(OTelService.getSdk().getTracer("passive"))
}
