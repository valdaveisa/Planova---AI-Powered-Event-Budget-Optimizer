<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $eventId = $request->query('event_id');

        if (! $eventId) {
            $event = Event::with(['divisions.budgetItems', 'auditReports'])->latest()->first();
        } else {
            $event = Event::with(['divisions.budgetItems', 'auditReports'])->find($eventId);
        }

        if (! $event) {
            return response()->json([
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $totalBudget = $event->total_budget;
        $totalSpent = 0;
        $divisionsSummary = [];

        foreach ($event->divisions as $division) {
            $spent = $division->budgetItems->sum(function ($item) {
                return $item->quantity * $item->unit_price;
            });
            $totalSpent += $spent;

            $divisionsSummary[] = [
                'id' => $division->id,
                'name' => $division->name,
                'budget_limit' => $division->budget_limit,
                'total_spent' => $spent,
                'usage_percent' => $division->budget_limit > 0 ? round(($spent / $division->budget_limit) * 100, 2) : 0,
                'items_count' => $division->budgetItems->count(),
            ];
        }

        $overallUsage = $totalBudget > 0 ? round(($totalSpent / $totalBudget) * 100, 2) : 0;
        $remainingBudget = $totalBudget - $totalSpent;

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date,
                'total_budget' => $totalBudget,
                'total_spent' => $totalSpent,
                'remaining_budget' => $remainingBudget,
                'overall_usage_percent' => $overallUsage,
            ],
            'divisions' => $divisionsSummary,
            'latest_audit' => $event->auditReports->last(),
        ]);
    }
}
