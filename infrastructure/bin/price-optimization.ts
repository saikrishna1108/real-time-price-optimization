#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { PriceOptimizationStack } from '../lib/price-optimization-stack';
 
const app = new App();
new PriceOptimizationStack(app, 'PriceOptimizationStack'); 