#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const price_optimization_stack_1 = require("../lib/price-optimization-stack");
const app = new aws_cdk_lib_1.App();
new price_optimization_stack_1.PriceOptimizationStack(app, 'PriceOptimizationStack');
