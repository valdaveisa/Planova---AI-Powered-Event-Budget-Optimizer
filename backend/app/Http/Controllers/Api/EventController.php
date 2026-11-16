<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::with(['divisions.budgetItems', 'auditReports'])->get();
        return response()->json($events);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'total_budget' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        $event = Event::create($validated);
        return response()->json($event, 201);
    }

    public function validateDivisionBudget(Request $request, $eventId): JsonResponse
    {
        $event = Event::with('divisions.budgetItems')->findOrFail($eventId);
        $totalAllocated = $event->divisions->sum('budget_limit');
        
        return response()->json([
            'total_budget' => $event->total_budget,
            'total_allocated' => $totalAllocated,
            'is_valid' => $totalAllocated <= $event->total_budget
        ]);
    }

    public function show(Event $event): JsonResponse
    {
        $event->load(['divisions.budgetItems', 'auditReports']);
        return response()->json($event);
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'total_budget' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
        ]);

        $event->update($validated);
        return response()->json($event);
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();
        return response()->json(null, 204);
    }

    public function summary(Request $request): JsonResponse
    {
        $eventId = $request->query('event_id');
        if (!$eventId) {
            return response()->json(['message' => 'event_id required'], 400);
        }

        $event = Event::with('divisions.budgetItems')->findOrFail($eventId);

        $divisions = $event->divisions->map(function ($division) {
            $items = $division->budgetItems;
            $totalSpent = $items->sum(fn($item) => $item->quantity * $item->unit_price);
            $usagePercent = $division->budget_limit > 0 ? round(($totalSpent / $division->budget_limit) * 100, 2) : 0;

            return [
                'id' => $division->id,
                'name' => $division->name,
                'budget_limit' => $division->budget_limit,
                'total_spent' => $totalSpent,
                'usage_percent' => $usagePercent,
            ];
        });

        $totalBudget = $event->total_budget;
        $totalSpent = $divisions->sum('total_spent');
        $remainingBudget = $totalBudget - $totalSpent;

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'total_budget' => $totalBudget,
                'total_spent' => $totalSpent,
                'remaining_budget' => $remainingBudget,
            ],
            'divisions' => $divisions,
        ]);
    }
}
