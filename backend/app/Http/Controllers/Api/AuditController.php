<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditReport;
use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    protected GeminiService $aiService;

    public function __construct(GeminiService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function index(): JsonResponse
    {
        $reports = AuditReport::with('event')->latest()->get();

        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
        ]);

        $event = Event::with('divisions.budgetItems')->findOrFail($validated['event_id']);

        $auditData = $this->prepareAuditData($event);

        $aiSuggestion = $this->aiService->auditBudget($auditData);

        $report = AuditReport::create([
            'event_id' => $event->id,
            'raw_json' => $auditData,
            'ai_suggestion' => $aiSuggestion,
        ]);

        return response()->json($report, 201);
    }

    public function show(AuditReport $auditReport): JsonResponse
    {
        $auditReport->load('event');

        return response()->json($auditReport);
    }

    public function destroy(AuditReport $auditReport): JsonResponse
    {
        $auditReport->delete();

        return response()->json(null, 204);
    }

    private function prepareAuditData(Event $event): array
    {
        $divisions = $event->divisions->map(function ($division) {
            $items = $division->budgetItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->totalPrice,
                    'vendor_name' => $item->vendor_name,
                    'status' => $item->status,
                ];
            });

            $divisionTotal = $items->sum('total_price');
            $budgetUsage = $division->budget_limit > 0 ? ($divisionTotal / $division->budget_limit) * 100 : 0;

            return [
                'id' => $division->id,
                'name' => $division->name,
                'budget_limit' => $division->budget_limit,
                'total_spent' => $divisionTotal,
                'budget_usage_percent' => round($budgetUsage, 2),
                'items' => $items,
            ];
        });

        $totalBudget = $event->total_budget;
        $totalSpent = $divisions->sum('total_spent');
        $overallUsage = $totalBudget > 0 ? ($totalSpent / $totalBudget) * 100 : 0;

        return [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'total_budget' => $event->total_budget,
                'date' => $event->date,
                'total_spent' => $totalSpent,
                'overall_usage_percent' => round($overallUsage, 2),
            ],
            'divisions' => $divisions,
        ];
    }
}
