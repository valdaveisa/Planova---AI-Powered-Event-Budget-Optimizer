<?php

use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\BudgetItemController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\EventController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::apiResource('events', EventController::class);
    Route::apiResource('divisions', DivisionController::class);
    Route::apiResource('budget-items', BudgetItemController::class);
    Route::apiResource('audits', AuditController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::get('budget-summary', [EventController::class, 'summary']);
});
